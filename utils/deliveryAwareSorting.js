const { DEFAULT_DELIVERY_DISTANCE_KM } = require('./deliveryValidation');

/**
 * Generates MongoDB aggregation pipeline stages that add delivery eligibility
 * info (`canDeliver`, `nearestBranchDistance`) to each dish document.
 *
 * Uses the ChefBranch collection to check if any active branch is within
 * its own delivery radius for the given user coordinates.
 *
 * Usage: Spread into an aggregation pipeline AFTER the initial $match stage.
 *
 * @param {number} userLat  - User's latitude
 * @param {number} userLng  - User's longitude
 * @returns {Object[]} Array of aggregation pipeline stages
 */
const getDeliveryPipelineStages = (userLat, userLng) => {
  return [
    // 1. Lookup active branches for each dish's chef
    {
      $lookup: {
        from: 'chefbranches',
        let: { chefId: '$user_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$chef', '$$chefId'] },
              isActive: true,
            },
          },
          // Only keep fields needed for distance calculation
          {
            $project: {
              'location.lat': 1,
              'location.long': 1,
              deliveryRadius: 1,
            },
          },
        ],
        as: '_branches',
      },
    },

    // 2. Calculate delivery eligibility based on branch distances
    {
      $addFields: {
        // For each branch, calculate distance and check if within radius
        _branchDelivery: {
          $map: {
            input: '$_branches',
            as: 'branch',
            in: {
              distance: {
                $multiply: [
                  6371, // Earth radius in km
                  {
                    $acos: {
                      $min: [
                        1,
                        {
                          $add: [
                            {
                              $multiply: [
                                { $sin: { $degreesToRadians: userLat } },
                                {
                                  $sin: {
                                    $degreesToRadians: {
                                      $ifNull: ['$$branch.location.lat', 0],
                                    },
                                  },
                                },
                              ],
                            },
                            {
                              $multiply: [
                                { $cos: { $degreesToRadians: userLat } },
                                {
                                  $cos: {
                                    $degreesToRadians: {
                                      $ifNull: ['$$branch.location.lat', 0],
                                    },
                                  },
                                },
                                {
                                  $cos: {
                                    $subtract: [
                                      {
                                        $degreesToRadians: {
                                          $ifNull: ['$$branch.location.long', 0],
                                        },
                                      },
                                      { $degreesToRadians: userLng },
                                    ],
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
              radius: {
                $ifNull: ['$$branch.deliveryRadius', DEFAULT_DELIVERY_DISTANCE_KM],
              },
            },
          },
        },
      },
    },

    // 3. Determine if ANY branch can deliver (distance ≤ radius)
    {
      $addFields: {
        canDeliver: {
          $cond: {
            if: { $gt: [{ $size: '$_branchDelivery' }, 0] },
            then: {
              $anyElementTrue: {
                $map: {
                  input: '$_branchDelivery',
                  as: 'bd',
                  in: { $lte: ['$$bd.distance', '$$bd.radius'] },
                },
              },
            },
            else: false,
          },
        },
        nearestBranchDistance: {
          $cond: {
            if: { $gt: [{ $size: '$_branchDelivery' }, 0] },
            then: {
              $round: [{ $min: '$_branchDelivery.distance' }, 1],
            },
            else: null,
          },
        },
      },
    },

    // 4. Clean up temporary fields
    {
      $unset: ['_branches', '_branchDelivery'],
    },
  ];
};

/**
 * Post-fetch delivery sort for results that come from non-aggregation sources
 * (e.g., semantic search). Groups results into deliverable-first, then
 * non-deliverable, preserving original order within each group.
 *
 * @param {Object[]} dishes - Array of dish documents with chef/user_id populated
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @returns {Promise<Object[]>} Sorted array with `canDeliver` field added
 */
const postFetchDeliverySort = async (dishes, userLat, userLng) => {
  if (!dishes.length || !userLat || !userLng) return dishes;

  const { findNearestBranch } = require('./deliveryValidation');

  // Collect unique chef IDs to batch-check delivery
  const chefIds = [...new Set(
    dishes.map(d => {
      const id = d.user_id?._id || d.user_id || d.chef?._id || d.chefId;
      return id?.toString();
    }).filter(Boolean)
  )];

  // Batch check delivery for all unique chefs
  const deliveryMap = new Map();
  await Promise.all(
    chefIds.map(async (chefId) => {
      try {
        const { nearestBranch, nearestDistance } = await findNearestBranch(chefId, userLat, userLng);
        if (nearestBranch) {
          const maxDistance = nearestBranch.deliveryRadius || DEFAULT_DELIVERY_DISTANCE_KM;
          deliveryMap.set(chefId, {
            canDeliver: nearestDistance <= maxDistance,
            nearestDistance: Math.round(nearestDistance * 10) / 10,
          });
        } else {
          deliveryMap.set(chefId, { canDeliver: false, nearestDistance: null });
        }
      } catch (err) {
        console.error(`Delivery check failed for chef ${chefId}:`, err.message);
        deliveryMap.set(chefId, { canDeliver: false, nearestDistance: null });
      }
    })
  );

  // Annotate dishes and sort: deliverable first
  const annotated = dishes.map(dish => {
    const chefId = (dish.user_id?._id || dish.user_id || dish.chef?._id || dish.chefId)?.toString();
    const delivery = deliveryMap.get(chefId) || { canDeliver: false, nearestDistance: null };
    return { ...dish, canDeliver: delivery.canDeliver, nearestBranchDistance: delivery.nearestDistance };
  });

  // Stable sort: deliverable first, preserve original order within each group
  const deliverable = annotated.filter(d => d.canDeliver);
  const nonDeliverable = annotated.filter(d => !d.canDeliver);

  return [...deliverable, ...nonDeliverable];
};

module.exports = {
  getDeliveryPipelineStages,
  postFetchDeliverySort,
};

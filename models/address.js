const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Address schema

const AddressSchema = new Schema({
    nameLine: String,
    location: {
        lat: String,
        long: String,
    },
    isPrimary: Boolean, 
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
});

AddressSchema.index({isPrimary: 1}, {unique: true, partialFilterExpression: {isPrimary: true}});

const Address = mongoose.model('address', AddressSchema);
module.exports = Address;

import feeConfig from '../../config/feeConfig';
import AboutContent from './AboutContent';

export default function AboutPage() {
    const orderFee = feeConfig.CHEF_ORDER_FEE;
    const feeTiers = feeConfig.SERVICE_FEE_TIERS;
    return <AboutContent orderFee={orderFee} feeTiers={feeTiers} />;
}

import feeConfig from '../../config/feeConfig';
import AboutContent from './AboutContent';

export default function AboutPage() {
    const orderFee = feeConfig.CHEF_ORDER_FEE;
    return <AboutContent orderFee={orderFee} />;
}

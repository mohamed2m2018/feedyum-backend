import feeConfig from '../../config/feeConfig';
import TermsContent from './TermsContent';

export default function TermsOfServicePage() {
    const orderFee = feeConfig.CHEF_ORDER_FEE;
    const feeTiers = feeConfig.SERVICE_FEE_TIERS;
    return <TermsContent orderFee={orderFee} feeTiers={feeTiers} />;
}

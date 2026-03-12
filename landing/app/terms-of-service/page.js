import feeConfig from '../../config/feeConfig';
import TermsContent from './TermsContent';

export default function TermsOfServicePage() {
    const orderFee = feeConfig.CHEF_ORDER_FEE;
    return <TermsContent orderFee={orderFee} />;
}

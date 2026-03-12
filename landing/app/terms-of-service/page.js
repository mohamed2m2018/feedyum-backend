import feeConfig from '../../../config/feeConfig';
import TermsContent from './TermsContent';

export default function TermsOfServicePage() {
    const commissionPercentage = feeConfig.CHEF_COMMISSION_PERCENTAGE * 100;
    return <TermsContent commissionPercentage={commissionPercentage} />;
}

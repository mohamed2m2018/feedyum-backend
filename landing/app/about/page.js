import feeConfig from '../../../config/feeConfig';
import AboutContent from './AboutContent';

export default function AboutPage() {
    const commissionPercentage = feeConfig.CHEF_COMMISSION_PERCENTAGE * 100;
    return <AboutContent commissionPercentage={commissionPercentage} />;
}

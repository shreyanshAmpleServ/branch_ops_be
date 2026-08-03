import { CompanyService } from './company.service.js';
const companyService = new CompanyService();
export class CompanyController {
    get = async (req, res, next) => {
        try {
            const details = await companyService.getCompanyDetails();
            if (!details) {
                res.status(404).json({ status: 'fail', message: 'Company details not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: details });
        }
        catch (err) {
            next(err);
        }
    };
    update = async (req, res, next) => {
        try {
            const details = await companyService.updateCompanyDetails(req.body);
            if (!details) {
                res.status(404).json({ status: 'fail', message: 'Company details not found or update failed' });
                return;
            }
            res.status(200).json({ status: 'success', data: details });
        }
        catch (err) {
            next(err);
        }
    };
}

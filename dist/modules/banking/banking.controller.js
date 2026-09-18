import { BankingService } from './banking.service.js';
export class BankingController {
    service;
    constructor() {
        this.service = new BankingService();
    }
    /* --- Overview --- */
    getOverview = async (req, res, next) => {
        try {
            const data = await this.service.getBankingOverview();
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    /* --- Incoming Payments --- */
    getIncomingPayments = async (req, res, next) => {
        try {
            const { search, status, startDate, endDate } = req.query;
            const data = await this.service.getIncomingPayments({
                search: search ? String(search) : undefined,
                status: status ? String(status) : undefined,
                startDate: startDate ? String(startDate) : undefined,
                endDate: endDate ? String(endDate) : undefined,
            });
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    getIncomingPaymentById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.service.getIncomingPaymentById(Number(id));
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    createIncomingPayment = async (req, res, next) => {
        try {
            const userId = req.user?.id || 1;
            const data = await this.service.createIncomingPayment(req.body, userId);
            res.status(201).json({ success: true, message: 'Incoming Payment recorded successfully', data });
        }
        catch (err) {
            next(err);
        }
    };
    deleteIncomingPayment = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await this.service.deleteIncomingPayment(Number(id));
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    };
    getAvailableInvoices = async (req, res, next) => {
        try {
            const { customerCode } = req.query;
            const data = await this.service.getAvailableInvoices(customerCode ? String(customerCode) : undefined);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    /* --- Outgoing Payments --- */
    getOutgoingPayments = async (req, res, next) => {
        try {
            const { search, status, startDate, endDate } = req.query;
            const data = await this.service.getOutgoingPayments({
                search: search ? String(search) : undefined,
                status: status ? String(status) : undefined,
                startDate: startDate ? String(startDate) : undefined,
                endDate: endDate ? String(endDate) : undefined,
            });
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    getOutgoingPaymentById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.service.getOutgoingPaymentById(Number(id));
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    createOutgoingPayment = async (req, res, next) => {
        try {
            const userId = req.user?.id || 1;
            const data = await this.service.createOutgoingPayment(req.body, userId);
            res.status(201).json({ success: true, message: 'Outgoing Payment recorded successfully', data });
        }
        catch (err) {
            next(err);
        }
    };
    deleteOutgoingPayment = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await this.service.deleteOutgoingPayment(Number(id));
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    };
    /* --- Petty Cash --- */
    getPettyCashAccounts = async (req, res, next) => {
        try {
            const data = await this.service.getPettyCashAccounts();
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    getPettyCashClaims = async (req, res, next) => {
        try {
            const { search, status, category, startDate, endDate } = req.query;
            const data = await this.service.getPettyCashClaims({
                search: search ? String(search) : undefined,
                status: status ? String(status) : undefined,
                category: category ? String(category) : undefined,
                startDate: startDate ? String(startDate) : undefined,
                endDate: endDate ? String(endDate) : undefined,
            });
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    getPettyCashClaimById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.service.getPettyCashClaimById(Number(id));
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
    createPettyCashClaim = async (req, res, next) => {
        try {
            const userId = req.user?.id || 1;
            const data = await this.service.createPettyCashClaim(req.body, userId);
            res.status(201).json({ success: true, message: 'Petty cash claim submitted successfully', data });
        }
        catch (err) {
            next(err);
        }
    };
    disbursePettyCashClaim = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { accountId } = req.body;
            const userId = req.user?.id || 1;
            const data = await this.service.disbursePettyCashClaim(Number(id), Number(accountId), userId);
            res.status(200).json({ success: true, message: 'Petty cash disbursed successfully', data });
        }
        catch (err) {
            next(err);
        }
    };
    /* --- Pending PO Payments --- */
    getPendingPoPayments = async (req, res, next) => {
        try {
            const { search, status } = req.query;
            const data = await this.service.getPendingPoPayments({
                search: search ? String(search) : undefined,
                status: status ? String(status) : undefined,
            });
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    };
}

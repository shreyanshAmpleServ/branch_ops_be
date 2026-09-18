import { Router } from 'express';
import { BankingController } from './banking.controller.js';
import { auth } from '../../middleware/auth.middleware.js';
const router = Router();
const controller = new BankingController();
router.use(auth);
// Overview
router.get('/overview', controller.getOverview);
// Incoming Payments
router.get('/incoming/available-invoices', controller.getAvailableInvoices);
router.get('/incoming', controller.getIncomingPayments);
router.get('/incoming/:id', controller.getIncomingPaymentById);
router.post('/incoming', controller.createIncomingPayment);
router.delete('/incoming/:id', controller.deleteIncomingPayment);
// Outgoing Payments
router.get('/outgoing', controller.getOutgoingPayments);
router.get('/outgoing/:id', controller.getOutgoingPaymentById);
router.post('/outgoing', controller.createOutgoingPayment);
router.delete('/outgoing/:id', controller.deleteOutgoingPayment);
// Petty Cash
router.get('/petty-cash/accounts', controller.getPettyCashAccounts);
router.get('/petty-cash/claims', controller.getPettyCashClaims);
router.get('/petty-cash/claims/:id', controller.getPettyCashClaimById);
router.post('/petty-cash/claims', controller.createPettyCashClaim);
router.post('/petty-cash/claims/:id/disburse', controller.disbursePettyCashClaim);
// Pending PO Payments
router.get('/pending-po', controller.getPendingPoPayments);
export default router;

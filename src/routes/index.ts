import { Router } from 'express';

// Route imports
import authRoutes from '../modules/auth/auth.routes.js';
import contactsRoutes from '../modules/contacts/contacts.routes.js';
import leadsRoutes from '../modules/leads/leads.routes.js';
import dealsRoutes from '../modules/deals/deals.routes.js';
import tasksRoutes from '../modules/tasks/tasks.routes.js';
import uploadRoutes from '../modules/upload/upload.routes.js';
import configRoutes from '../modules/config/config.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import masterRoutes from '../modules/master/master.routes.js';
import branchesRoutes from '../modules/branches/branches.routes.js';
import companyRoutes from '../modules/company/company.routes.js';
import expenseEntryRoutes from '../modules/expense-entry/expense-entry.routes.js';
import retailersRoutes from '../modules/retailers/retailers.routes.js';
import warehouseRoutes from '../modules/warehouse/warehouse.routes.js';
import itemsRoutes from '../modules/items/items.routes.js';
import itemPricesRoutes from '../modules/item-prices/item-prices.routes.js';
import purchaseRequestsRoutes from '../modules/purchase-request/purchase-request.routes.js';
import purchaseQuotationsRoutes from '../modules/purchase-quotation/purchase-quotation.routes.js';
import purchaseOrdersRoutes from '../modules/purchase-order/purchase-order.routes.js';
import goodsReceiptRoutes from '../modules/goods-receipt/goods-receipt.routes.js';
import apInvoiceRoutes from '../modules/ap-invoice/ap-invoice.routes.js';
import projectsRoutes from '../modules/projects/projects.routes.js';
import quotationsRoutes from '../modules/quotations/quotations.routes.js';
import ordersRoutes from '../modules/orders/orders.routes.js';
import arInvoiceRoutes from '../modules/ar-invoice/ar-invoice.routes.js';
import bankingRoutes from '../modules/banking/banking.routes.js';

const router = Router();

// Route bindings
router.use('/auth', authRoutes);
router.use('/contacts', contactsRoutes);
router.use('/customers', contactsRoutes);
router.use('/leads', leadsRoutes);
router.use('/deals', ordersRoutes);
router.use('/orders', ordersRoutes);
router.use('/tasks', tasksRoutes);
router.use('/upload', uploadRoutes);
router.use('/config', configRoutes);
router.use('/users', usersRoutes);
router.use('/master', masterRoutes);
router.use('/branches', branchesRoutes);
router.use('/company', companyRoutes);
router.use('/expense-entry', expenseEntryRoutes);
router.use('/retailers', retailersRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/items', itemsRoutes);
router.use('/item-prices', itemPricesRoutes);
router.use('/purchase-requests', purchaseRequestsRoutes);
router.use('/purchase-quotations', purchaseQuotationsRoutes);
router.use('/purchase-orders', purchaseOrdersRoutes);
router.use('/goods-receipts', goodsReceiptRoutes);
router.use('/grpo', goodsReceiptRoutes);
router.use('/ap-invoice', apInvoiceRoutes);
router.use('/ap-invoices', apInvoiceRoutes);
router.use('/projects', projectsRoutes);
router.use('/quotations', quotationsRoutes);
router.use('/ar-invoice', arInvoiceRoutes);
router.use('/ar-invoices', arInvoiceRoutes);
router.use('/invoices', arInvoiceRoutes);
router.use('/banking', bankingRoutes);

export default router;

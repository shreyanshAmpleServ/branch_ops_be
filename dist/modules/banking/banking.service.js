import { prisma } from '../../config/db.js';
import { NotFoundError, BadRequestError } from '../../utils/appError.js';
export class BankingService {
    /* =========================================================================
     * 1. BANKING OVERVIEW / DASHBOARD
     * ========================================================================= */
    async getBankingOverview() {
        // Current month date boundaries
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Sum incoming payments
        const incomingAll = await prisma.incoming_payments.findMany({
            select: { total_amount: true, status: true, posting_date: true, currency: true },
        });
        let totalIncomingAllTime = 0;
        let totalIncomingThisMonth = 0;
        incomingAll.forEach((p) => {
            const amt = Number(p.total_amount || 0);
            totalIncomingAllTime += amt;
            if (p.posting_date && new Date(p.posting_date) >= startOfMonth) {
                totalIncomingThisMonth += amt;
            }
        });
        // Sum outgoing payments
        const outgoingAll = await prisma.outgoing_payments.findMany({
            select: { total_amount: true, status: true, posting_date: true, currency: true },
        });
        let totalOutgoingAllTime = 0;
        let totalOutgoingThisMonth = 0;
        outgoingAll.forEach((p) => {
            const amt = Number(p.total_amount || 0);
            totalOutgoingAllTime += amt;
            if (p.posting_date && new Date(p.posting_date) >= startOfMonth) {
                totalOutgoingThisMonth += amt;
            }
        });
        // Petty cash accounts balance
        const accounts = await prisma.petty_cash_accounts.findMany({
            where: { is_active: true },
        });
        let totalPettyCashBalance = 0;
        let totalPettyCashAuthorized = 0;
        accounts.forEach((acc) => {
            totalPettyCashBalance += Number(acc.current_balance || 0);
            totalPettyCashAuthorized += Number(acc.authorized_limit || 0);
        });
        // Pending PO payments count & amount
        const pendingPoList = await prisma.outgoingPayPurchaseOrder.findMany({
            where: { status: 'active' },
        });
        let totalPendingPoLiability = 0;
        pendingPoList.forEach((po) => {
            totalPendingPoLiability += Number(po.balance || po.advance_amount || 0);
        });
        // Recent combined transactions
        const recentIncoming = await prisma.incoming_payments.findMany({
            take: 5,
            orderBy: { id: 'desc' },
            include: {
                customer: { select: { Code: true, Name: true } },
            },
        });
        const recentOutgoing = await prisma.outgoing_payments.findMany({
            take: 5,
            orderBy: { id: 'desc' },
            include: {
                vendor: { select: { Code: true, Name: true } },
            },
        });
        const combinedRecent = [
            ...recentIncoming.map((inc) => ({
                id: `INC-${inc.id}`,
                doc_number: inc.doc_number,
                party: inc.customer?.Name || inc.customer_code,
                party_code: inc.customer_code,
                type: 'incoming',
                payment_type: inc.payment_type || 'Incoming Payment',
                amount: Number(inc.total_amount || 0),
                currency: inc.currency || 'TZS',
                date: inc.posting_date || inc.created_on,
                status: inc.status || 'Posted',
            })),
            ...recentOutgoing.map((out) => ({
                id: `OUT-${out.id}`,
                doc_number: out.doc_number,
                party: out.vendor?.Name || out.vendor_code,
                party_code: out.vendor_code,
                type: 'outgoing',
                payment_type: out.payment_type || 'Outgoing Payment',
                amount: Number(out.total_amount || 0),
                currency: out.currency || 'TZS',
                date: out.posting_date || out.created_on,
                status: out.status || 'Posted',
            })),
        ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 8);
        return {
            totalIncomingAllTime,
            totalIncomingThisMonth,
            incomingCount: incomingAll.length,
            totalOutgoingAllTime,
            totalOutgoingThisMonth,
            outgoingCount: outgoingAll.length,
            netCashFlow: totalIncomingThisMonth - totalOutgoingThisMonth,
            totalPettyCashBalance,
            totalPettyCashAuthorized,
            pettyAccountsCount: accounts.length,
            totalPendingPoLiability,
            pendingPoCount: pendingPoList.length,
            recentTransactions: combinedRecent,
            accounts: accounts.map((a) => ({
                id: a.id,
                account_name: a.account_name,
                gl_account_code: a.gl_account_code,
                current_balance: Number(a.current_balance || 0),
                authorized_limit: Number(a.authorized_limit || 0),
                currency: a.currency || 'TZS',
                is_active: a.is_active,
            })),
        };
    }
    /* =========================================================================
     * 2. INCOMING PAYMENTS
     * ========================================================================= */
    async getIncomingPayments(params) {
        const where = {};
        if (params.status && params.status !== 'all') {
            where.status = params.status;
        }
        if (params.startDate || params.endDate) {
            where.posting_date = {};
            if (params.startDate)
                where.posting_date.gte = new Date(params.startDate);
            if (params.endDate)
                where.posting_date.lte = new Date(params.endDate);
        }
        if (params.search) {
            where.OR = [
                { doc_number: { contains: params.search } },
                { customer_code: { contains: params.search } },
                { customer: { Name: { contains: params.search } } },
                { reference_number: { contains: params.search } },
                { journal_remarks: { contains: params.search } },
            ];
        }
        const list = await prisma.incoming_payments.findMany({
            where,
            orderBy: { id: 'desc' },
            include: {
                customer: { select: { Code: true, Name: true, Address: true, OwnerMobileNo: true } },
                creator: { select: { id: true, FirstName: true, LastName: true } },
                incoming_payment_invoices: {
                    include: {
                        ar_invoice: { select: { ID: true, InvoiceCode: true, SAPDocNum: true, DocTotal: true, Status: true } },
                    },
                },
                incoming_payment_means: true,
            },
        });
        return list.map((item) => ({
            ...item,
            customer_name: item.customer?.Name || item.customer_code,
            created_by_name: item.creator ? `${item.creator.FirstName} ${item.creator.LastName || ''}`.trim() : null,
            invoices_count: item.incoming_payment_invoices?.length || 0,
            means_count: item.incoming_payment_means?.length || 0,
            primary_means: item.incoming_payment_means?.[0]?.means_type || 'cash',
        }));
    }
    async getIncomingPaymentById(id) {
        const payment = await prisma.incoming_payments.findUnique({
            where: { id },
            include: {
                customer: { select: { Code: true, Name: true, Address: true, OwnerMobileNo: true } },
                creator: { select: { id: true, FirstName: true, LastName: true } },
                incoming_payment_invoices: {
                    include: {
                        ar_invoice: true,
                    },
                },
                incoming_payment_means: true,
            },
        });
        if (!payment)
            throw new NotFoundError('Incoming Payment not found');
        return {
            ...payment,
            customer_name: payment.customer?.Name || payment.customer_code,
            customer_address: payment.customer?.Address || null,
            customer_mobile: payment.customer?.OwnerMobileNo || null,
            created_by_name: payment.creator ? `${payment.creator.FirstName} ${payment.creator.LastName || ''}`.trim() : null,
        };
    }
    async generateIncomingDocNumber() {
        const year = new Date().getFullYear().toString().slice(-2);
        const count = await prisma.incoming_payments.count();
        return `IP${year}/${String(count + 1).padStart(4, '0')}`;
    }
    async createIncomingPayment(data, createdById) {
        const docNumber = data.doc_number || (await this.generateIncomingDocNumber());
        const postDate = data.posting_date ? new Date(data.posting_date) : new Date();
        const docDate = data.document_date ? new Date(data.document_date) : postDate;
        const payment = await prisma.$transaction(async (tx) => {
            const created = await tx.incoming_payments.create({
                data: {
                    doc_number: docNumber,
                    customer_code: data.customer_code,
                    payment_type: data.payment_type || 'Incoming Payment (A/R Invoice)',
                    posting_date: postDate,
                    document_date: docDate,
                    reference_number: data.reference_number || null,
                    journal_remarks: data.journal_remarks || null,
                    total_amount: data.total_amount,
                    currency: data.currency || 'TZS',
                    status: data.status || 'Posted',
                    created_by: createdById,
                    created_on: new Date(),
                },
            });
            // Insert linked AR Invoices
            if (data.invoices && data.invoices.length > 0) {
                await tx.incoming_payment_invoices.createMany({
                    data: data.invoices.map((inv) => ({
                        parent_id: created.id,
                        ar_invoice_id: inv.ar_invoice_id,
                        applied_amount: inv.applied_amount,
                        discount_amount: inv.discount_amount || 0,
                        total_payment: inv.total_payment,
                        invoice_date: inv.invoice_date ? new Date(inv.invoice_date) : postDate,
                        balance_due: inv.balance_due || 0,
                        total_received: inv.total_received || inv.applied_amount,
                    })),
                });
                // Mark associated AR Invoices as paid if fully settled
                for (const inv of data.invoices) {
                    if (inv.balance_due === 0 || inv.balance_due == null) {
                        await tx.arInvoice.update({
                            where: { ID: inv.ar_invoice_id },
                            data: { Status: 'Paid' },
                        }).catch(() => null);
                    }
                }
            }
            // Insert payment means
            if (data.means && data.means.length > 0) {
                await tx.incoming_payment_means.createMany({
                    data: data.means.map((m) => ({
                        parent_id: created.id,
                        means_type: m.means_type,
                        gl_account: m.gl_account,
                        amount: m.amount,
                        transfer_date: m.transfer_date ? new Date(m.transfer_date) : postDate,
                        reference_num: m.reference_num || null,
                        check_bank_code: m.check_bank_code || null,
                        cc_name: m.cc_name || null,
                        is_cleared: m.is_cleared !== undefined ? m.is_cleared : true,
                    })),
                });
            }
            return created;
        });
        return this.getIncomingPaymentById(payment.id);
    }
    async deleteIncomingPayment(id) {
        const existing = await prisma.incoming_payments.findUnique({ where: { id } });
        if (!existing)
            throw new NotFoundError('Incoming Payment not found');
        await prisma.$transaction([
            prisma.incoming_payment_invoices.deleteMany({ where: { parent_id: id } }),
            prisma.incoming_payment_means.deleteMany({ where: { parent_id: id } }),
            prisma.incoming_payments.delete({ where: { id } }),
        ]);
        return { success: true, message: 'Incoming Payment deleted successfully' };
    }
    async getAvailableInvoices(customerCode) {
        const where = {
            Status: { in: ['O', 'Open', 'OPEN', 'Unpaid', 'Pending'] },
        };
        if (customerCode) {
            where.CustCode = customerCode;
        }
        const invoices = await prisma.arInvoice.findMany({
            where,
            orderBy: { ID: 'desc' },
            select: {
                ID: true,
                InvoiceCode: true,
                CustCode: true,
                CustName: true,
                PostDate: true,
                DueDate: true,
                DocTotal: true,
                Status: true,
                Currency: true,
            },
        });
        return invoices;
    }
    /* =========================================================================
     * 3. OUTGOING PAYMENTS
     * ========================================================================= */
    async getOutgoingPayments(params) {
        const where = {};
        if (params.status && params.status !== 'all') {
            where.status = params.status;
        }
        if (params.startDate || params.endDate) {
            where.posting_date = {};
            if (params.startDate)
                where.posting_date.gte = new Date(params.startDate);
            if (params.endDate)
                where.posting_date.lte = new Date(params.endDate);
        }
        if (params.search) {
            where.OR = [
                { doc_number: { contains: params.search } },
                { vendor_code: { contains: params.search } },
                { vendor: { Name: { contains: params.search } } },
                { reference_number: { contains: params.search } },
                { journal_remarks: { contains: params.search } },
            ];
        }
        const list = await prisma.outgoing_payments.findMany({
            where,
            orderBy: { id: 'desc' },
            include: {
                vendor: { select: { Code: true, Name: true, Address: true } },
                creator: { select: { id: true, FirstName: true, LastName: true } },
                outgoing_payment_invoices: true,
                outgoing_payment_means: true,
            },
        });
        return list.map((item) => ({
            ...item,
            vendor_name: item.vendor?.Name || item.vendor_code,
            created_by_name: item.creator ? `${item.creator.FirstName} ${item.creator.LastName || ''}`.trim() : null,
            invoices_count: item.outgoing_payment_invoices?.length || 0,
            means_count: item.outgoing_payment_means?.length || 0,
            primary_means: item.outgoing_payment_means?.[0]?.means_type || 'bank',
            bank_account: item.outgoing_payment_means?.[0]?.gl_account || null,
        }));
    }
    async getOutgoingPaymentById(id) {
        const payment = await prisma.outgoing_payments.findUnique({
            where: { id },
            include: {
                vendor: { select: { Code: true, Name: true, Address: true } },
                creator: { select: { id: true, FirstName: true, LastName: true } },
                outgoing_payment_invoices: true,
                outgoing_payment_means: true,
            },
        });
        if (!payment)
            throw new NotFoundError('Outgoing Payment not found');
        return {
            ...payment,
            vendor_name: payment.vendor?.Name || payment.vendor_code,
            created_by_name: payment.creator ? `${payment.creator.FirstName} ${payment.creator.LastName || ''}`.trim() : null,
        };
    }
    async generateOutgoingDocNumber() {
        const year = new Date().getFullYear().toString().slice(-2);
        const count = await prisma.outgoing_payments.count();
        return `OP${year}/${String(count + 1).padStart(4, '0')}`;
    }
    async createOutgoingPayment(data, createdById) {
        const docNumber = data.doc_number || (await this.generateOutgoingDocNumber());
        const postDate = data.posting_date ? new Date(data.posting_date) : new Date();
        const docDate = data.document_date ? new Date(data.document_date) : postDate;
        const payment = await prisma.$transaction(async (tx) => {
            const created = await tx.outgoing_payments.create({
                data: {
                    doc_number: docNumber,
                    vendor_code: data.vendor_code,
                    base_request_id: data.base_request_id || null,
                    payment_type: data.payment_type || 'Outgoing Payment (A/P Invoice)',
                    posting_date: postDate,
                    document_date: docDate,
                    reference_number: data.reference_number || null,
                    journal_remarks: data.journal_remarks || null,
                    total_amount: data.total_amount,
                    currency: data.currency || 'TZS',
                    status: data.status || 'Posted',
                    project_code: data.project_code || null,
                    cost_center: data.cost_center || null,
                    created_by: createdById,
                    created_on: new Date(),
                },
            });
            // Insert linked AP Invoices
            if (data.invoices && data.invoices.length > 0) {
                await tx.outgoing_payment_invoices.createMany({
                    data: data.invoices.map((inv) => ({
                        parent_id: created.id,
                        ap_invoice_id: String(inv.ap_invoice_id),
                        applied_amount: inv.applied_amount,
                        discount_amount: inv.discount_amount || 0,
                        total_payment: inv.total_payment,
                        invice_date: inv.invice_date ? new Date(inv.invice_date) : postDate,
                        total_amount: inv.total_amount || inv.applied_amount,
                        balance_due: inv.balance_due || 0,
                        payment_amount: inv.payment_amount || inv.applied_amount,
                    })),
                });
            }
            // Insert payment means
            if (data.means && data.means.length > 0) {
                await tx.outgoing_payment_means.createMany({
                    data: data.means.map((m) => ({
                        parent_id: created.id,
                        means_type: m.means_type,
                        gl_account: m.gl_account,
                        amount: m.amount,
                        transfer_date: m.transfer_date ? new Date(m.transfer_date) : postDate,
                        reference_num: m.reference_num || null,
                        bank_name: m.bank_name || null,
                        account_number: m.account_number || null,
                        check_number: m.check_number || null,
                        check_date: m.check_date ? new Date(m.check_date) : null,
                        is_cleared: m.is_cleared !== undefined ? m.is_cleared : true,
                    })),
                });
            }
            return created;
        });
        return this.getOutgoingPaymentById(payment.id);
    }
    async deleteOutgoingPayment(id) {
        const existing = await prisma.outgoing_payments.findUnique({ where: { id } });
        if (!existing)
            throw new NotFoundError('Outgoing Payment not found');
        await prisma.$transaction([
            prisma.outgoing_payment_invoices.deleteMany({ where: { parent_id: id } }),
            prisma.outgoing_payment_means.deleteMany({ where: { parent_id: id } }),
            prisma.outgoing_payments.delete({ where: { id } }),
        ]);
        return { success: true, message: 'Outgoing Payment deleted successfully' };
    }
    /* =========================================================================
     * 4. PETTY CASH
     * ========================================================================= */
    async getPettyCashAccounts() {
        const accounts = await prisma.petty_cash_accounts.findMany({
            orderBy: { id: 'asc' },
            include: {
                custodian: { select: { id: true, FirstName: true, LastName: true, Email: true } },
            },
        });
        return accounts.map((a) => ({
            ...a,
            custodian_name: a.custodian ? `${a.custodian.FirstName} ${a.custodian.LastName || ''}`.trim() : `User #${a.custodian_user_id}`,
            current_balance: Number(a.current_balance || 0),
            authorized_limit: Number(a.authorized_limit || 0),
        }));
    }
    async getPettyCashClaims(params) {
        const where = {};
        if (params.status && params.status !== 'all') {
            where.status = params.status;
        }
        if (params.category && params.category !== 'all') {
            where.category = params.category;
        }
        if (params.startDate || params.endDate) {
            where.request_date = {};
            if (params.startDate)
                where.request_date.gte = new Date(params.startDate);
            if (params.endDate)
                where.request_date.lte = new Date(params.endDate);
        }
        if (params.search) {
            where.OR = [
                { claim_number: { contains: params.search } },
                { department: { contains: params.search } },
                { category: { contains: params.search } },
                { manager_approval_notes: { contains: params.search } },
                { requester: { FirstName: { contains: params.search } } },
            ];
        }
        const claims = await prisma.petty_cash_claims.findMany({
            where,
            orderBy: { id: 'desc' },
            include: {
                petty_cash_lines: true,
                petty_cash_accounts: true,
                requester: { select: { id: true, FirstName: true, LastName: true, Email: true } },
                approver: { select: { id: true, FirstName: true, LastName: true } },
            },
        });
        return claims.map((c) => ({
            ...c,
            requester_name: c.requester ? `${c.requester.FirstName} ${c.requester.LastName || ''}`.trim() : `User #${c.requester_user_id}`,
            approver_name: c.approver ? `${c.approver.FirstName} ${c.approver.LastName || ''}`.trim() : null,
            total_requested: Number(c.total_requested || 0),
            lines_count: c.petty_cash_lines?.length || 0,
            account_name: c.petty_cash_accounts?.account_name || null,
        }));
    }
    async getPettyCashClaimById(id) {
        const claim = await prisma.petty_cash_claims.findUnique({
            where: { id },
            include: {
                petty_cash_lines: true,
                petty_cash_accounts: true,
                requester: { select: { id: true, FirstName: true, LastName: true, Email: true } },
                approver: { select: { id: true, FirstName: true, LastName: true } },
            },
        });
        if (!claim)
            throw new NotFoundError('Petty Cash Claim not found');
        return {
            ...claim,
            requester_name: claim.requester ? `${claim.requester.FirstName} ${claim.requester.LastName || ''}`.trim() : `User #${claim.requester_user_id}`,
            requester_email: claim.requester?.Email || null,
            approver_name: claim.approver ? `${claim.approver.FirstName} ${claim.approver.LastName || ''}`.trim() : null,
            total_requested: Number(claim.total_requested || 0),
        };
    }
    async generateClaimNumber() {
        const year = new Date().getFullYear().toString().slice(-2);
        const count = await prisma.petty_cash_claims.count();
        return `PCC${year}/${String(count + 1).padStart(4, '0')}`;
    }
    async createPettyCashClaim(data, userId) {
        const claimNumber = data.claim_number || (await this.generateClaimNumber());
        const reqDate = data.request_date ? new Date(data.request_date) : new Date();
        const claim = await prisma.$transaction(async (tx) => {
            const created = await tx.petty_cash_claims.create({
                data: {
                    claim_number: claimNumber,
                    requester_user_id: data.requester_user_id || userId,
                    department: data.department || 'General',
                    request_date: reqDate,
                    total_requested: data.total_requested,
                    category: data.category || 'General Expense',
                    currency: data.currency || 'TZS',
                    status: data.status || 'Pending Manager',
                    manager_approval_notes: data.manager_approval_notes || null,
                    created_by: userId,
                    created_on: new Date(),
                },
            });
            if (data.lines && data.lines.length > 0) {
                await tx.petty_cash_lines.createMany({
                    data: data.lines.map((l) => ({
                        parent_id: created.id,
                        expense_gl_account: l.expense_gl_account,
                        description: l.description,
                        amount: l.amount,
                        has_receipt_attachment: l.has_receipt_attachment || false,
                        receipt_file_path: l.receipt_file_path || null,
                    })),
                });
            }
            return created;
        });
        return this.getPettyCashClaimById(claim.id);
    }
    async disbursePettyCashClaim(id, accountId, approvedById) {
        const claim = await prisma.petty_cash_claims.findUnique({ where: { id } });
        if (!claim)
            throw new NotFoundError('Petty Cash Claim not found');
        const account = await prisma.petty_cash_accounts.findUnique({ where: { id: accountId } });
        if (!account)
            throw new NotFoundError('Petty Cash Account not found');
        const amount = Number(claim.total_requested || 0);
        const currentBal = Number(account.current_balance || 0);
        if (currentBal < amount) {
            throw new BadRequestError(`Insufficient petty cash balance in ${account.account_name}. Available: ${currentBal}, Required: ${amount}`);
        }
        await prisma.$transaction([
            prisma.petty_cash_accounts.update({
                where: { id: accountId },
                data: {
                    current_balance: currentBal - amount,
                },
            }),
            prisma.petty_cash_claims.update({
                where: { id },
                data: {
                    status: 'Disbursed',
                    disbursed_from_account_id: accountId,
                    disbursed_date: new Date(),
                    approved_by: approvedById,
                    updated_by: approvedById,
                    updated_on: new Date(),
                },
            }),
        ]);
        return this.getPettyCashClaimById(id);
    }
    /* =========================================================================
     * 5. PENDING PO PAYMENTS
     * ========================================================================= */
    async getPendingPoPayments(params) {
        const where = {};
        if (params.status && params.status !== 'all') {
            where.status = params.status;
        }
        if (params.search) {
            where.OR = [
                { request_no: { contains: params.search } },
                { request_type: { contains: params.search } },
            ];
        }
        const pendingList = await prisma.outgoingPayPurchaseOrder.findMany({
            where,
            orderBy: { id: 'desc' },
        });
        // Also fetch advance requests to give rich context
        const advanceRequests = await prisma.po_advance_requests.findMany({
            select: {
                id: true,
                request_no: true,
                po_id: true,
                calculated_amount: true,
                priority: true,
                funds_required_by: true,
                justification: true,
                finance_status: true,
            },
        });
        const advanceMap = new Map(advanceRequests.map((a) => [a.id, a]));
        return pendingList.map((item) => {
            const adv = item.request_id ? advanceMap.get(item.request_id) : null;
            return {
                id: item.id,
                parent_id: item.parent_id,
                request_id: item.request_id,
                request_no: item.request_no || adv?.request_no || `REQ-${item.id}`,
                po_id: adv?.po_id || null,
                po_total: item.po_total ? Number(item.po_total) : null,
                advance_amount: Number(item.advance_amount || adv?.calculated_amount || 0),
                balance: Number(item.balance || 0),
                priority: adv?.priority || 'Normal',
                funds_required_by: adv?.funds_required_by || null,
                justification: adv?.justification || null,
                status: adv?.finance_status || item.status || 'Active',
                created_at: item.created_at,
            };
        });
    }
}

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
};
export const PERMISSIONS = {
    CONTACTS_VIEW: 'contacts.view',
    CONTACTS_CREATE: 'contacts.create',
    CONTACTS_EDIT: 'contacts.edit',
    CONTACTS_DELETE: 'contacts.delete',
    LEADS_VIEW: 'leads.view',
    LEADS_CREATE: 'leads.create',
    LEADS_EDIT: 'leads.edit',
    LEADS_DELETE: 'leads.delete',
    DEALS_VIEW: 'deals.view',
    DEALS_CREATE: 'deals.create',
    DEALS_EDIT: 'deals.edit',
    DEALS_DELETE: 'deals.delete',
    TASKS_VIEW: 'tasks.view',
    TASKS_CREATE: 'tasks.create',
    TASKS_EDIT: 'tasks.edit',
    TASKS_DELETE: 'tasks.delete',
    ANALYTICS_VIEW: 'analytics.view',
    USERS_VIEW: 'users.view',
    USERS_MANAGE: 'users.manage',
};
export const ROLE_PERMISSIONS = {
    admin: Object.values(PERMISSIONS),
    manager: [
        PERMISSIONS.CONTACTS_VIEW, PERMISSIONS.CONTACTS_CREATE, PERMISSIONS.CONTACTS_EDIT,
        PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_CREATE, PERMISSIONS.LEADS_EDIT,
        PERMISSIONS.DEALS_VIEW, PERMISSIONS.DEALS_CREATE, PERMISSIONS.DEALS_EDIT,
        PERMISSIONS.TASKS_VIEW, PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_EDIT,
        PERMISSIONS.ANALYTICS_VIEW
    ],
    user: [
        PERMISSIONS.CONTACTS_VIEW,
        PERMISSIONS.LEADS_VIEW,
        PERMISSIONS.DEALS_VIEW,
        PERMISSIONS.TASKS_VIEW, PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_EDIT
    ]
};

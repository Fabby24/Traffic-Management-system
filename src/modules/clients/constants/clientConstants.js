const CLIENT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

const CLIENT_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};

const CONTACT_METHODS = {
    EMAIL: 'email',
    PHONE: 'phone',
    WHATSAPP: 'whatsapp',
    TEAMS: 'teams',
    SLACK: 'slack',
};

const INDUSTRIES = [
    'Technology',
    'Media',
    'Finance',
    'Healthcare',
    'Retail',
    'Manufacturing',
    'Education',
    'Nonprofit',
    'Government',
    'Real Estate',
    'Hospitality',
    'Food & Beverage',
    'Fashion',
    'Automotive',
    'Aerospace',
    'Energy',
    'Telecommunications',
    'Consulting',
    'Marketing',
    'Other',
];

const CLIENT_TAGS = [
    'VIP',
    'Retainer',
    'One-time',
    'High Priority',
    'Marketing',
    'Branding',
    'Internal',
];

const STATUS_LABELS = {
    [CLIENT_STATUS.ACTIVE]: 'Active',
    [CLIENT_STATUS.INACTIVE]: 'Inactive',
};

const PRIORITY_LABELS = {
    [CLIENT_PRIORITY.LOW]: 'Low',
    [CLIENT_PRIORITY.MEDIUM]: 'Medium',
    [CLIENT_PRIORITY.HIGH]: 'High',
};

const STATUS_COLORS = {
    [CLIENT_STATUS.ACTIVE]: 'bg-green-500/10 text-green-400 border-green-500/20',
    [CLIENT_STATUS.INACTIVE]: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PRIORITY_COLORS = {
    [CLIENT_PRIORITY.LOW]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    [CLIENT_PRIORITY.MEDIUM]: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    [CLIENT_PRIORITY.HIGH]: 'bg-red-500/10 text-red-400 border-red-500/20',
};

module.exports = {
    CLIENT_STATUS,
    CLIENT_PRIORITY,
    CONTACT_METHODS,
    INDUSTRIES,
    CLIENT_TAGS,
    STATUS_LABELS,
    PRIORITY_LABELS,
    STATUS_COLORS,
    PRIORITY_COLORS,
};
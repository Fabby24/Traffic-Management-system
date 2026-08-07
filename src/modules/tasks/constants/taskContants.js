const TASK_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    READY_FOR_REVIEW: 'ready_for_review',
    NEEDS_CHANGES: 'needs_changes',
    BLOCKED: 'blocked',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
};

const TASK_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};

const ALLOWED_STATUS_TRANSITIONS = {
    [TASK_STATUS.TODO]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.BLOCKED],
    [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.TODO, TASK_STATUS.BLOCKED, TASK_STATUS.READY_FOR_REVIEW],
    [TASK_STATUS.BLOCKED]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.TODO],
    [TASK_STATUS.READY_FOR_REVIEW]: [TASK_STATUS.NEEDS_CHANGES, TASK_STATUS.COMPLETED],
    [TASK_STATUS.NEEDS_CHANGES]: [TASK_STATUS.IN_PROGRESS],
    [TASK_STATUS.COMPLETED]: [TASK_STATUS.ARCHIVED],
    [TASK_STATUS.ARCHIVED]: [],
};

const STATUS_LABELS = {
    [TASK_STATUS.TODO]: 'To Do',
    [TASK_STATUS.IN_PROGRESS]: 'In Progress',
    [TASK_STATUS.READY_FOR_REVIEW]: 'Ready For Review',
    [TASK_STATUS.NEEDS_CHANGES]: 'Needs Changes',
    [TASK_STATUS.BLOCKED]: 'Blocked',
    [TASK_STATUS.COMPLETED]: 'Completed',
    [TASK_STATUS.ARCHIVED]: 'Archived',
};

const PRIORITY_LABELS = {
    [TASK_PRIORITY.LOW]: 'Low',
    [TASK_PRIORITY.MEDIUM]: 'Medium',
    [TASK_PRIORITY.HIGH]: 'High',
    [TASK_PRIORITY.CRITICAL]: 'Critical',
};

const PRIORITY_COLORS = {
    [TASK_PRIORITY.LOW]: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400',
    [TASK_PRIORITY.MEDIUM]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    [TASK_PRIORITY.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    [TASK_PRIORITY.CRITICAL]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_COLORS = {
    [TASK_STATUS.TODO]: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400',
    [TASK_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    [TASK_STATUS.READY_FOR_REVIEW]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    [TASK_STATUS.NEEDS_CHANGES]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    [TASK_STATUS.BLOCKED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    [TASK_STATUS.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    [TASK_STATUS.ARCHIVED]: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400',
};

const TASK_ACTIONS = {
    CREATED: 'task_created',
    ASSIGNED: 'task_assigned',
    STATUS_CHANGED: 'task_status_changed',
    REVIEWED: 'task_reviewed',
    COMMENTED: 'task_commented',
    ATTACHMENT_ADDED: 'task_attachment_added',
    DEPENDENCY_ADDED: 'task_dependency_added',
    DEPENDENCY_REMOVED: 'task_dependency_removed',
    PROGRESS_UPDATED: 'task_progress_updated',
    ARCHIVED: 'task_archived',
    RESTORED: 'task_restored',
    DELETED: 'task_deleted',
};

module.exports = {
    TASK_STATUS,
    TASK_PRIORITY,
    ALLOWED_STATUS_TRANSITIONS,
    STATUS_LABELS,
    PRIORITY_LABELS,
    PRIORITY_COLORS,
    STATUS_COLORS,
    TASK_ACTIONS,
};
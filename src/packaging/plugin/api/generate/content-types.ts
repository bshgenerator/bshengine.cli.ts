
type ContentTemplate = {
    template: object;
    variables: {
        name: string,
        type: 'string' | 'number' | 'boolean',
        target: string,
        default?: string | number | boolean,
        defaultFromOption?: string,
        allowedValues?: string[]
    }[];
}

const BshEntitiesTemplate = {
    name: '<name>',
    bshSchema: '<schema name>',
    dbTable: '<db table name>',
    dbSchema: '<db schema>',
    updateStrategy: 'Upsert|Replace',
    insertDuplicate: 'Upsert|Error',
    pks: [
        {
            key: '<primary key name>',
            strategy: 'AutoIncrement|UUID|Fixed',
            type: 'number|string'
        }
    ],
    permissions: {
        read: true,
        write: true,
        delete: true,
        update: true
    },
    auditable: true,
    isPluginBase: true
}

const BshSchemasTemplate = {
    name: '<name>',
    description: '<description>',
    label: '<label>',
    bshPlugin: '<plugin name>',
    additionalProperties: true,
    properties: [
        {
            type: '<type>',
            name: '<property name>',
            label: '<label>',
            meta: {
                description: '<property description>',
                required: false,
                unique: true
            }
        }
    ]
}

const BshTypesTemplate = {
    name: '<name>',
    label: '<label>',
    baseType: '<base type>',
    meta: {
        description: '<description>',
        pattern: '<pattern>',
        maxLength: -1,
        minLength: -1,
        max: 0,
        min: 0,
        default: '<default value>'
    }
}

const BshRolesTemplate = {
    name: '<name>',
    description: '<description>',
    public: false
}

const BshPoliciesTemplate = {
    name: '<name>',
    description: '<description>',
    principals: [
        {
            type: 'ROLE|USER|API_KEY',
            value: [
                '<principal value>'
            ]
        }
    ],
    permissions: [
        {
            entity: [
                '<entity name>|*'
            ],
            actions: [
                'READ|WRITE|DELETE|UPDATE|*'
            ],
            allow: true
        }
    ],
    enabled: true
}

const BshTriggersTemplate = {
    label: 'ClearEntitiesCache',
    criteria: null,
    name: 'ClearEntitiesCache',
    action: [
        'INSERT',
        'UPDATE'
    ],
    entity: 'BshEntities',
    events: [
        {
            name: 'Clear Cache',
            function: 'ClearCache',
            input: {
                name: 'bshEntitiesCache'
            },
            enabled: true
        }
    ],
    enabled: true
}

const BshEmailTemplatesTemplate = {
    name: '<name>',
    html: true,
    subject: '<subject>',
    body: '<body>'
}

export const CONTENT_TEMPLATES: Record<string, ContentTemplate> = {
    BshEntities: {
        template: BshEntitiesTemplate,
        variables: [
            { name: 'name', type: 'string', target: '$.name', defaultFromOption: 'name' },
            { name: 'bshSchema', type: 'string', target: '$.bshSchema' },
            { name: 'dbTable', type: 'string', target: '$.dbTable', defaultFromOption: 'name' },
            { name: 'dbSchema', type: 'string', target: '$.dbSchema' },
            { name: 'updateStrategy', type: 'string', target: '$.updateStrategy', default: 'Upsert' },
            { name: 'insertDuplicate', type: 'string', target: '$.insertDuplicate', default: 'Error' },
            { name: 'pk-key', type: 'string', target: '$.pks[0].key', default: 'id' },
            { name: 'pk-strategy', type: 'string', target: '$.pks[0].strategy', default: 'AutoIncrement' },
            { name: 'pk-type', type: 'string', target: '$.pks[0].type', default: 'number' },
        ]
    },
    BshSchemas: {
        template: BshSchemasTemplate,
        variables: [
            { name: 'name', type: 'string', target: '$.name', defaultFromOption: 'name' },
            { name: 'description', type: 'string', target: '$.description' },
            { name: 'label', type: 'string', target: '$.label' },
        ]
    },
    BshTypes: {
        template: BshTypesTemplate,
        variables: [
            { name: 'name', type: 'string', target: '$.name', defaultFromOption: 'name' },
            { name: 'label', type: 'string', target: '$.label', defaultFromOption: 'name' },
            { name: 'baseType', type: 'string', target: '$.baseType', default: 'string' },
        ]
    },
    BshRoles: {
        template: BshRolesTemplate,
        variables: [
            { name: 'name', type: 'string', target: '$.name', defaultFromOption: 'name' },
            { name: 'description', type: 'string', target: '$.description' },
        ]
    },
    BshPolicies: {
        template: BshPoliciesTemplate,
        variables: [
            { name: 'name', type: 'string', target: '$.name', defaultFromOption: 'name' },
            { name: 'description', type: 'string', target: '$.description' },
        ]
    },
    BshTriggers: {
        template: BshTriggersTemplate,
        variables: [
            { name: 'label', type: 'string', target: '$.label', defaultFromOption: 'name' },
            { name: 'name', type: 'string', target: '$.name', defaultFromOption: 'name' },
            { name: 'action', type: 'string', target: '$.action' },
            { name: 'entity', type: 'string', target: '$.entity' },
        ]
    },
    BshEmailTemplates: {
        template: BshEmailTemplatesTemplate,
        variables: [
            { name: 'name', type: 'string', target: '$.name', defaultFromOption: 'name' },
            { name: 'subject', type: 'string', target: '$.subject' },
            { name: 'body', type: 'string', target: '$.body' },
        ]
    }
}
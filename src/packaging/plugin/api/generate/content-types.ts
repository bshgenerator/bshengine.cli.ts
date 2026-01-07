export const CONTENT_TYPES: Record<string, any> = {
  BshEntities: {
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
  },
  BshPolicies: {
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
  },
  BshRoles: {
    name: '<name>',
    description: '<description>',
    public: false
  },
  BshSchemas: {
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
  },
  BshTypes: {
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
  },
  BshTriggers: {
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
  },
  BshEmailTemplates: {
    name: '<name>',
    html: true,
    subject: '<subject>',
    body: '<body>'
  }
};

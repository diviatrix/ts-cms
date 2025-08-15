import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TypeScript CMS API',
      version: '1.0.0',
      description: 'RESTful API for content management, user authentication, and theme management',
    },
    servers: [
      {
        url: 'http://localhost:7331',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', nullable: true },
            message: { type: 'string' },
            errors: { 
              type: 'array',
              items: { type: 'string' },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            login: { type: 'string' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Record: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            content: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            categories: {
              type: 'array',
              items: { type: 'string' },
            },
            is_published: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Theme: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            is_active: { type: 'boolean' },
            is_default: { type: 'boolean' },
            created_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Invite: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            created_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            used_by: { type: 'string', format: 'uuid', nullable: true },
            used_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            login: { type: 'string' },
            email: { type: 'string', format: 'email' },
            public_name: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            roles: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        ProfileUpdateRequest: {
          type: 'object',
          properties: {
            public_name: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
          },
        },
        PasswordChangeRequest: {
          type: 'object',
          required: ['newPassword'],
          properties: {
            userId: { type: 'string', format: 'uuid', nullable: true },
            newPassword: { type: 'string', minLength: 6 },
          },
        },
        ThemeSettings: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        ThemeWithSettings: {
          type: 'object',
          properties: {
            theme: { $ref: '#/components/schemas/Theme' },
            settings: { $ref: '#/components/schemas/ThemeSettings' },
          },
        },
        ThemeCreateRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            is_active: { type: 'boolean', default: false },
            is_default: { type: 'boolean', default: false },
          },
        },
        ThemeUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            is_active: { type: 'boolean' },
            is_default: { type: 'boolean' },
          },
        },
        ThemeSettingRequest: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
            type: {
              type: 'string',
              enum: ['string', 'number', 'boolean', 'color', 'font', 'json'],
              default: 'string'
            },
          },
        },
        UserThemePreference: {
          type: 'object',
          required: ['theme_id'],
          properties: {
            theme_id: { type: 'string', format: 'uuid' },
            custom_settings: {
              type: 'object',
              additionalProperties: true,
              default: {},
            },
          },
        },
        CMSSetting: {
          type: 'object',
          properties: {
            setting_key: { type: 'string' },
            setting_value: { type: 'string' },
            setting_type: {
              type: 'string',
              enum: ['string', 'number', 'boolean', 'json']
            },
            description: { type: 'string', nullable: true },
            category: {
              type: 'string',
              enum: ['general', 'theme', 'security', 'content']
            },
            updated_at: { type: 'string', format: 'date-time' },
            updated_by: { type: 'string', format: 'uuid' },
          },
        },
        CMSSettingUpdate: {
          type: 'object',
          required: ['value'],
          properties: {
            value: { type: 'string' },
            type: {
              type: 'string',
              enum: ['string', 'number', 'boolean', 'json'],
              default: 'string'
            },
          },
        },
        ThemeConfigRequest: {
          type: 'object',
          properties: {
            theme_id: { type: 'string', format: 'uuid' },
          },
        },
        RegistrationMode: {
          type: 'object',
          properties: {
            registration_mode: {
              type: 'string',
              enum: ['OPEN', 'INVITE', 'CLOSED'],
              default: 'OPEN',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: { type: 'string' },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: ['Field is required', 'Invalid format'],
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
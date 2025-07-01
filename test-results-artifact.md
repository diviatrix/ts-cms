# Test Results Artifact - 2025-07-01T15:14:48

## Test Summary
- **Total Tests**: 9
- **Passing**: 4 ✅
- **Failing**: 5 ❌
- **Duration**: 114ms

## Passing Tests ✅
1. Records - should get a list of published records
2. Themes - should get a list of all themes  
3. Themes - should get the active theme
4. Themes - should get settings for a specific theme

## Failing Tests ❌

### 1. GET /api - should return a status message
- **Expected**: `{ status: 'ok' }`
- **Actual**: `{ status: 'OK' }` 
- **Issue**: Case mismatch in response

### 2. Authentication - should register a new user
- **Expected Status**: 200
- **Actual Status**: 422 (Unprocessable Entity)
- **Issue**: Validation error on registration

### 3. Authentication - should login the user  
- **Expected Status**: 200
- **Actual Status**: 401 (Unauthorized)
- **Issue**: User not found (likely because registration failed)

### 4. Records - should get a specific published record
- **Expected Status**: 200
- **Actual Status**: 422 (Unprocessable Entity) 
- **Issue**: Invalid record ID format (using "1" instead of UUID)

### 5. Themes - should get a specific theme by id
- **Expected Status**: 200
- **Actual Status**: 404 (Not Found)
- **Issue**: Theme with ID "1" doesn't exist (should use actual theme UUID)

## Database State
- Active theme: "Default Theme" (ID: 985ed02d-df49-47d1-8152-1149ccf2775d)
- Available records: 1 published record (ID: dc2a6063-6112-40ab-9105-abcb57f04cb3)
- Theme settings: 10 configured settings for default theme

## Next Steps
1. Fix API response case sensitivity
2. Debug registration validation
3. Update test IDs to use actual UUIDs from database
4. Verify authentication flow


PS F:\GitRepos\ts-cms> npm test

> ts-cms@1.0.0 test
> mocha --require ts-node/register --project tsconfig.test.json tests/**/*.ts

Database constructor called.
SQLiteAdapter constructor called.
Connected to SQLite database: ./data/database.db


  GET /api
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    { name: 'users' },
    { name: 'records' },
    { name: 'stats' },
    { name: 'roles' },
    { name: 'files' },
    { name: 'user_profiles' },
    { name: 'user_groups' },
    { name: 'sessions' },
    { name: 'themes' },
    { name: 'theme_settings' },
    { name: 'user_theme_preferences' }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    'users',
    'records',
    'stats',
    'roles',
    'files',
    'user_profiles',
    'user_groups',
    'sessions',
    'themes',
    'theme_settings',
    'user_theme_preferences'
  ]
}
All tables exist: { success: true, message: 'All tables exist', data: undefined }
{ success: true, message: 'All tables exist', data: undefined }
[2025-07-01T15:19:28.786Z] INFO: API Request: GET / | Context: {}
    ✔ should return a status message

  Authentication
[2025-07-01T15:19:28.804Z] INFO: API Request: POST /register | Context: {}
[2025-07-01T15:19:28.816Z] INFO: User registration attempt | Context: {"login":"testuser","email":"test@example.com"}
SQL query executed successfully: { success: true, message: 'SQL query executed successfully', data: [] }
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: {
    login: 'testuser',
    email: 'test@example.com',
    password_hash: '$2b$10$4DgYT7Ootw9tVZyVqsFPx.KLsPjlReK4FLjSxyE/TLbUrMtSCJ3sO',
    id: '520fc02c-e0b6-4bc6-80ce-ec64b83c251b'
  }
}
    1) should register a new user
[2025-07-01T15:19:28.936Z] INFO: API Request: POST /login | Context: {}
[2025-07-01T15:19:28.937Z] INFO: User login attempt | Context: {"login":"testuser"}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      id: '520fc02c-e0b6-4bc6-80ce-ec64b83c251b',
      login: 'testuser',
      email: 'test@example.com',
      password_hash: '$2b$10$4DgYT7Ootw9tVZyVqsFPx.KLsPjlReK4FLjSxyE/TLbUrMtSCJ3sO',
      is_active: 1
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: {
    id: '520fc02c-e0b6-4bc6-80ce-ec64b83c251b',
    login: 'testuser',
    email: 'test@example.com',
    password_hash: '$2b$10$4DgYT7Ootw9tVZyVqsFPx.KLsPjlReK4FLjSxyE/TLbUrMtSCJ3sO',
    is_active: 1
  }
}
SQL query executed successfully: { success: true, message: 'SQL query executed successfully', data: [] }
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: '520fc02c-e0b6-4bc6-80ce-ec64b83c251b'
}
SQL query executed successfully: { success: true, message: 'SQL query executed successfully', data: [] }
Operation successful: { success: true, message: 'Operation successful', data: [] }
Token generated successfully: {
  success: true,
  message: 'Token generated successfully',
  data: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyMGZjMDJjLWUwYjYtNGJjNi04MGNlLWVjNjRiODNjMjUxYiIsInNlc3Npb25JZCI6IjU0OTRlOGZkLTBmMzYtNGU2ZS04MmQ5LTE2OTVmMTVmYWFjNiIsInJvbGVzIjpbXSwiaWF0IjoxNzUxMzgzMTY5LCJleHAiOjE3NTEzODY3Njl9.CQkmSxLbVvipG1yTQTNuKqnVRKz17RCddA75iSneqhw'
}
SQL query executed successfully: { success: true, message: 'SQL query executed successfully', data: [] }
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: '5494e8fd-0f36-4e6e-82d9-1695f15faac6'
}
ok: {
  success: true,
  message: 'ok',
  data: {
    user: {
      id: '520fc02c-e0b6-4bc6-80ce-ec64b83c251b',
      login: 'testuser',
      email: 'test@example.com',
      is_active: 1
    },
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyMGZjMDJjLWUwYjYtNGJjNi04MGNlLWVjNjRiODNjMjUxYiIsInNlc3Npb25JZCI6IjU0OTRlOGZkLTBmMzYtNGU2ZS04MmQ5LTE2OTVmMTVmYWFjNiIsInJvbGVzIjpbXSwiaWF0IjoxNzUxMzgzMTY5LCJleHAiOjE3NTEzODY3Njl9.CQkmSxLbVvipG1yTQTNuKqnVRKz17RCddA75iSneqhw'
  }
}
[2025-07-01T15:19:29.050Z] INFO: Auth Action: login | Context: {"userId":"520fc02c-e0b6-4bc6-80ce-ec64b83c251b","success":true}
    ✔ should login the user (119ms)

  Records
[2025-07-01T15:19:29.056Z] INFO: API Request: GET /records | Context: {}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      id: 'dc2a6063-6112-40ab-9105-abcb57f04cb3',
      title: '123',
      description: '123',
      content: '123',
      user_id: '16128294-4b07-49e1-8aa0-66d285fbcf4a',
      tags: '["123"]',
      categories: '["123"]',
      is_published: 1,
      created_at: '2025-07-01T13:47:28.264Z',
      updated_at: '2025-07-01T13:47:28.264Z',
      public_name: 'User'
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      id: 'dc2a6063-6112-40ab-9105-abcb57f04cb3',
      title: '123',
      description: '123',
      content: '123',
      user_id: '16128294-4b07-49e1-8aa0-66d285fbcf4a',
      tags: [Array],
      categories: [Array],
      is_published: true,
      created_at: 2025-07-01T13:47:28.264Z,
      updated_at: 2025-07-01T13:47:28.264Z,
      public_name: 'User'
    }
  ]
}
    ✔ should get a list of published records
[2025-07-01T15:19:29.063Z] INFO: API Request: GET /records/dc2a6063-6112-40ab-9105-abcb57f04cb3 | Context: {}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      id: 'dc2a6063-6112-40ab-9105-abcb57f04cb3',
      title: '123',
      description: '123',
      content: '123',
      user_id: '16128294-4b07-49e1-8aa0-66d285fbcf4a',
      tags: '["123"]',
      categories: '["123"]',
      is_published: 1,
      created_at: '2025-07-01T13:47:28.264Z',
      updated_at: '2025-07-01T13:47:28.264Z'
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: {
    id: 'dc2a6063-6112-40ab-9105-abcb57f04cb3',
    title: '123',
    description: '123',
    content: '123',
    user_id: '16128294-4b07-49e1-8aa0-66d285fbcf4a',
    tags: [ '123' ],
    categories: [ '123' ],
    is_published: true,
    created_at: 2025-07-01T13:47:28.264Z,
    updated_at: 2025-07-01T13:47:28.264Z
  }
}
    ✔ should get a specific published record

  Themes
[2025-07-01T15:19:29.072Z] INFO: API Request: GET /themes | Context: {}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      name: 'Default Theme',
      description: 'Default TypeScript CMS theme with modern dark styling55',
      is_active: 1,
      is_default: 1,
      created_by: '886eaab1-10a6-4279-87c0-68e1863a9350',
      created_at: '2025-07-01 12:11:54',
      updated_at: '2025-07-01 14:07:32'
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      name: 'Default Theme',
      description: 'Default TypeScript CMS theme with modern dark styling55',
      is_active: 1,
      is_default: 1,
      created_by: '886eaab1-10a6-4279-87c0-68e1863a9350',
      created_at: '2025-07-01 12:11:54',
      updated_at: '2025-07-01 14:07:32'
    }
  ]
}
    ✔ should get a list of all themes
[2025-07-01T15:19:29.078Z] INFO: API Request: GET /themes/active | Context: {}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      name: 'Default Theme',
      description: 'Default TypeScript CMS theme with modern dark styling55',
      is_active: 1,
      is_default: 1,
      created_by: '886eaab1-10a6-4279-87c0-68e1863a9350',
      created_at: '2025-07-01 12:11:54',
      updated_at: '2025-07-01 14:07:32'
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: {
    id: '985ed02d-df49-47d1-8152-1149ccf2775d',
    name: 'Default Theme',
    description: 'Default TypeScript CMS theme with modern dark styling55',
    is_active: 1,
    is_default: 1,
    created_by: '886eaab1-10a6-4279-87c0-68e1863a9350',
    created_at: '2025-07-01 12:11:54',
    updated_at: '2025-07-01 14:07:32'
  }
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'background_color',
      setting_value: '#222222',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'border_color',
      setting_value: '#ff0059',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'font_family',
      setting_value: "'Share Tech Mono', monospace",
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'footer_text',
      setting_value: '1',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'primary_color',
      setting_value: '#666bff',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'secondary_color',
      setting_value: '#1d93aa',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'surface_color',
      setting_value: '#444444',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_color',
      setting_value: '#e0e0e0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_muted',
      setting_value: '#a0a0a0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_secondary',
      setting_value: '#c0c0c0',
      setting_type: 'string'
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'background_color',
      setting_value: '#222222',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'border_color',
      setting_value: '#ff0059',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'font_family',
      setting_value: "'Share Tech Mono', monospace",
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'footer_text',
      setting_value: '1',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'primary_color',
      setting_value: '#666bff',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'secondary_color',
      setting_value: '#1d93aa',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'surface_color',
      setting_value: '#444444',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_color',
      setting_value: '#e0e0e0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_muted',
      setting_value: '#a0a0a0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_secondary',
      setting_value: '#c0c0c0',
      setting_type: 'string'
    }
  ]
}
    ✔ should get the active theme
[2025-07-01T15:19:29.085Z] INFO: API Request: GET /themes/985ed02d-df49-47d1-8152-1149ccf2775d | Context: {}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      name: 'Default Theme',
      description: 'Default TypeScript CMS theme with modern dark styling55',
      is_active: 1,
      is_default: 1,
      created_by: '886eaab1-10a6-4279-87c0-68e1863a9350',
      created_at: '2025-07-01 12:11:54',
      updated_at: '2025-07-01 14:07:32'
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: {
    id: '985ed02d-df49-47d1-8152-1149ccf2775d',
    name: 'Default Theme',
    description: 'Default TypeScript CMS theme with modern dark styling55',
    is_active: 1,
    is_default: 1,
    created_by: '886eaab1-10a6-4279-87c0-68e1863a9350',
    created_at: '2025-07-01 12:11:54',
    updated_at: '2025-07-01 14:07:32'
  }
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'background_color',
      setting_value: '#222222',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'border_color',
      setting_value: '#ff0059',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'font_family',
      setting_value: "'Share Tech Mono', monospace",
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'footer_text',
      setting_value: '1',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'primary_color',
      setting_value: '#666bff',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'secondary_color',
      setting_value: '#1d93aa',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'surface_color',
      setting_value: '#444444',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_color',
      setting_value: '#e0e0e0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_muted',
      setting_value: '#a0a0a0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_secondary',
      setting_value: '#c0c0c0',
      setting_type: 'string'
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'background_color',
      setting_value: '#222222',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'border_color',
      setting_value: '#ff0059',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'font_family',
      setting_value: "'Share Tech Mono', monospace",
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'footer_text',
      setting_value: '1',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'primary_color',
      setting_value: '#666bff',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'secondary_color',
      setting_value: '#1d93aa',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'surface_color',
      setting_value: '#444444',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_color',
      setting_value: '#e0e0e0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_muted',
      setting_value: '#a0a0a0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_secondary',
      setting_value: '#c0c0c0',
      setting_type: 'string'
    }
  ]
}
    ✔ should get a specific theme by id
[2025-07-01T15:19:29.093Z] INFO: API Request: GET /themes/985ed02d-df49-47d1-8152-1149ccf2775d/settings | Context: {}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'background_color',
      setting_value: '#222222',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'border_color',
      setting_value: '#ff0059',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'font_family',
      setting_value: "'Share Tech Mono', monospace",
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'footer_text',
      setting_value: '1',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'primary_color',
      setting_value: '#666bff',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'secondary_color',
      setting_value: '#1d93aa',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'surface_color',
      setting_value: '#444444',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_color',
      setting_value: '#e0e0e0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_muted',
      setting_value: '#a0a0a0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_secondary',
      setting_value: '#c0c0c0',
      setting_type: 'string'
    }
  ]
}
SQL query executed successfully: {
  success: true,
  message: 'SQL query executed successfully',
  data: [
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'background_color',
      setting_value: '#222222',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'border_color',
      setting_value: '#ff0059',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'font_family',
      setting_value: "'Share Tech Mono', monospace",
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'footer_text',
      setting_value: '1',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'primary_color',
      setting_value: '#666bff',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'secondary_color',
      setting_value: '#1d93aa',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'surface_color',
      setting_value: '#444444',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_color',
      setting_value: '#e0e0e0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_muted',
      setting_value: '#a0a0a0',
      setting_type: 'string'
    },
    {
      theme_id: '985ed02d-df49-47d1-8152-1149ccf2775d',
      setting_key: 'text_secondary',
      setting_value: '#c0c0c0',
      setting_type: 'string'
    }
  ]
}
    ✔ should get settings for a specific theme


  8 passing (332ms)
  1 failing

  1) Authentication
       should register a new user:

      Uncaught AssertionError: expected 201 to equal 200
      + expected - actual

      -201
      +200

      at Test.<anonymous> (tests\api.test.ts:27:35)
      at Test.assert (node_modules\supertest\lib\test.js:187:8)
      at Server.localAssert (node_modules\supertest\lib\test.js:135:14)
      at Object.onceWrapper (node:events:621:28)
      at Server.emit (node:events:507:28)
      at Server.emit (node:domain:489:12)
      at emitCloseNT (node:net:2418:8)
      at processTicksAndRejections (node:internal/process/task_queues:89:21)



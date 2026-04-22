import IResolve from '../types/IResolve';

/**
 * Minimal database adapter interface for test data cleanup
 */
export interface DatabaseAdapter {
  query(query: string, params?: (string | number | boolean | null)[]): Promise<IResolve<unknown[]>>;
  beginTransaction?(): Promise<void> | Promise<IResolve<boolean>>;
  commitTransaction?(): Promise<void> | Promise<IResolve<boolean>>;
  rollbackTransaction?(): Promise<void> | Promise<IResolve<boolean>>;
}

export interface CleanupOptions {
  preserveAdmins?: boolean;        // Don't delete admin users (first_admin, system, and users with admin role)
  preserveDefaultTheme?: boolean;  // Don't delete the default theme
  preserveActiveThemes?: boolean;  // Don't delete active themes
  preserveProductionSettings?: boolean; // Don't delete critical production settings
  userPatterns?: string[];         // Patterns for test users: ['testuser_%', 'test_%', etc.]
  onlyRecentData?: boolean;        // Only delete data created within the recent time threshold
  hoursThreshold?: number;         // Hours threshold for recent data (default: 24)
  dryRun?: boolean;                // Only show what would be deleted
}

export interface CleanupReport {
  totalDeleted: number;
  byTable: Record<string, number>;
  messages: string[];
  warnings: string[];
}

export class TestDataCleaner {
  private db: DatabaseAdapter;
  private options: CleanupOptions;

  // Default patterns for test user identification
  private defaultUserPatterns = [
    'test%',
    'debug%',
    'demo%',
    'sample%',
    'example%',
    '%@test.%',
    '%@example.%',
    '%@localhost%'
  ];

  // Critical production settings to preserve
  private productionSettings = [
    'site_name',
    'site_description',
    'active_theme_id',
    'maintenance_mode',
    'allow_registration',
    'registration_mode',
    'default_user_role',
    'default_categories',
    'pagination_size',
    'pagination_max_size',
    'enable_search'
  ];

  constructor(db: DatabaseAdapter, options: CleanupOptions = {}) {
    this.db = db;
    this.options = {
      preserveAdmins: true,
      preserveDefaultTheme: true,
      preserveActiveThemes: true,
      preserveProductionSettings: true,
      onlyRecentData: false,
      hoursThreshold: 24,
      dryRun: false,
      userPatterns: this.defaultUserPatterns,
      ...options
    };
  }

  /**
   * Main cleanup method
   */
  async cleanup(): Promise<IResolve<CleanupReport>> {
    const report: CleanupReport = {
      totalDeleted: 0,
      byTable: {},
      messages: [],
      warnings: []
    };

    const mode = this.options.dryRun ? '🔍 DRY RUN' : '🚀 CLEANUP';
    this.log(`${mode} STARTED`);
    this.log(`Options: preserveAdmins=${this.options.preserveAdmins}, preserveDefaultTheme=${this.options.preserveDefaultTheme}, preserveProductionSettings=${this.options.preserveProductionSettings}, onlyRecentData=${this.options.onlyRecentData}, hoursThreshold=${this.options.hoursThreshold}`);

    try {
      // Start transaction if not dry run
      if (!this.options.dryRun && this.db.beginTransaction) {
        await this.db.beginTransaction();
      }

      // Execute cleanup in order respecting foreign key constraints
      const userDeleteCount = await this.cleanupUsers();
      report.byTable['users'] = userDeleteCount;
      report.totalDeleted += userDeleteCount;

      const inviteDeleteCount = await this.cleanupInvites();
      report.byTable['invites'] = inviteDeleteCount;
      report.totalDeleted += inviteDeleteCount;

      const recordDeleteCount = await this.cleanupRecords();
      report.byTable['records'] = recordDeleteCount;
      report.totalDeleted += recordDeleteCount;

      const themeDeleteCount = await this.cleanupThemes();
      report.byTable['themes'] = themeDeleteCount;
      report.totalDeleted += themeDeleteCount;

      const settingsDeleteCount = await this.cleanupSettings();
      report.byTable['cms_settings'] = settingsDeleteCount;
      report.totalDeleted += settingsDeleteCount;

      await this.cleanupOrphanedData();

      // Commit transaction if not dry run
      if (!this.options.dryRun && this.db.commitTransaction) {
        await this.db.commitTransaction();
      }

      this.log(`✅ Cleanup completed. Total deleted: ${report.totalDeleted}`);
      return { success: true, message: `Cleanup completed. Total deleted: ${report.totalDeleted}`, data: report };

    } catch (error) {
      // Rollback transaction on error
      if (!this.options.dryRun && this.db.rollbackTransaction) {
        await this.db.rollbackTransaction();
      }
      this.log(`❌ Cleanup failed: ${error}`);
      return { success: false, message: `Cleanup failed: ${error}`, data: report };
    }
  }

  /**
   * Cleanup test users - DISABLED: Users are now managed by external auth service
   */
  public async cleanupUsers(): Promise<number> {
    this.log('🧹 User cleanup disabled - users are now managed by external auth service');
    return 0;
  }

  /**
   * Cleanup test invites
   */
  public async cleanupInvites(): Promise<number> {
    this.log('🧹 Cleaning up invites...');
    let totalDeleted = 0;

    const timeCondition = this.options.onlyRecentData
      ? `AND datetime(created_at) > datetime('now', '-${this.options.hoursThreshold} hours')`
      : '';

    // Delete unused invites older than 1 day (hardcoded logic from original)
    const unusedQuery = `DELETE FROM invites WHERE used_by IS NULL AND datetime(created_at) < datetime('now', '-1 day')`;
    const unusedResult = await this.executeQueryWithCount(unusedQuery);
    if (unusedResult.deleted > 0) {
      this.log(`  ✓ Deleted ${unusedResult.deleted} unused invites (>1 day old)`);
    }
    totalDeleted += unusedResult.deleted;

    // Delete invites with test codes
    const testCodeQuery = `DELETE FROM invites WHERE code LIKE 'test%' OR code LIKE 'debug%' OR code LIKE 'demo%' ${timeCondition}`;
    const testCodeResult = await this.executeQueryWithCount(testCodeQuery);
    if (testCodeResult.deleted > 0) {
      this.log(`  ✓ Deleted ${testCodeResult.deleted} invites with test codes`);
    }
    totalDeleted += testCodeResult.deleted;

    // Delete invites from non-existent users
    const orphanQuery = `DELETE FROM invites WHERE created_by NOT IN (SELECT id FROM users)`;
    const orphanResult = await this.executeQueryWithCount(orphanQuery);
    if (orphanResult.deleted > 0) {
      this.log(`  ✓ Deleted ${orphanResult.deleted} orphaned invites`);
    }
    totalDeleted += orphanResult.deleted;

    this.log(`  📊 Total invites deleted: ${totalDeleted}`);
    return totalDeleted;
  }

  /**
   * Cleanup test themes
   */
  public async cleanupThemes(): Promise<number> {
    this.log('🧹 Cleaning up themes...');
    let totalDeleted = 0;

    // Find protected theme IDs
    let protectedIds: string[] = [];
    if (this.options.preserveDefaultTheme || this.options.preserveActiveThemes) {
      const whereClauses: string[] = [];
      if (this.options.preserveDefaultTheme) {
        whereClauses.push('is_default = 1');
      }
      if (this.options.preserveActiveThemes) {
        whereClauses.push('is_active = 1');
      }
      const whereClause = whereClauses.join(' OR ');

      const result = await this.db.query(
        `SELECT id FROM themes WHERE ${whereClause}`
      );
      if (result.success && result.data && Array.isArray(result.data)) {
        protectedIds = (result.data as Array<Record<string, unknown>>).map((row) => row.id as string);
      }
    }

    const protectionClause = protectedIds.length > 0
      ? `AND id NOT IN (${protectedIds.map(() => '?').join(', ')})`
      : '';

    const timeCondition = this.options.onlyRecentData
      ? `AND datetime(created_at) > datetime('now', '-${this.options.hoursThreshold} hours')`
      : '';

    // Delete test themes (by name patterns)
    const query = `DELETE FROM themes WHERE (name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%DEBUG%') ${protectionClause} ${timeCondition}`;
    const result = await this.executeQueryWithCount(query, protectedIds);
    totalDeleted += result.deleted;

    if (protectedIds.length > 0) {
      this.log(`  🛡️  Protected ${protectedIds.length} theme(s)`);
    }
    this.log(`  📊 Total themes deleted: ${totalDeleted}`);
    return totalDeleted;
  }

  /**
   * Cleanup test records
   */
  public async cleanupRecords(): Promise<number> {
    this.log('🧹 Cleaning up records...');
    let totalDeleted = 0;

    const timeCondition = this.options.onlyRecentData
      ? `AND datetime(created_at) > datetime('now', '-${this.options.hoursThreshold} hours')`
      : '';

    // Delete records with test content
    const testContentQuery = `DELETE FROM records WHERE (
      title LIKE '%test%' OR
      title LIKE '%debug%' OR
      title LIKE '%sample%' OR
      title LIKE '%example%' OR
      description LIKE '%test%' OR
      content LIKE '%test%'
    ) ${timeCondition}`;
    const testContentResult = await this.executeQueryWithCount(testContentQuery);
    if (testContentResult.deleted > 0) {
      this.log(`  ✓ Deleted ${testContentResult.deleted} records with test content`);
    }
    totalDeleted += testContentResult.deleted;

    // Delete orphaned records
    const orphanQuery = `DELETE FROM records WHERE user_id NOT IN (SELECT id FROM users)`;
    const orphanResult = await this.executeQueryWithCount(orphanQuery);
    if (orphanResult.deleted > 0) {
      this.log(`  ✓ Deleted ${orphanResult.deleted} orphaned records`);
    }
    totalDeleted += orphanResult.deleted;

    this.log(`  📊 Total records deleted: ${totalDeleted}`);
    return totalDeleted;
  }

  /**
   * Cleanup test settings
   */
  public async cleanupSettings(): Promise<number> {
    this.log('🧹 Cleaning up CMS settings...');
    let totalDeleted = 0;

    const timeCondition = this.options.onlyRecentData
      ? `AND datetime(updated_at) > datetime('now', '-${this.options.hoursThreshold} hours')`
      : '';

    // Protection clause for production settings
    const protectionClause = this.options.preserveProductionSettings
      ? `AND setting_key NOT IN (${this.productionSettings.map(() => '?').join(', ')})`
      : '';

    // Delete settings with test/debug/sample prefixes/suffixes
    const testPrefixQuery = `DELETE FROM cms_settings WHERE (
      setting_key LIKE '%_test' OR
      setting_key LIKE 'test_%' OR
      setting_key LIKE 'debug_%' OR
      setting_key LIKE '%_debug' OR
      setting_key LIKE 'sample_%'
    ) ${protectionClause} ${timeCondition}`;

    const params = this.options.preserveProductionSettings ? this.productionSettings : [];
    const result = await this.executeQueryWithCount(testPrefixQuery, params);
    totalDeleted += result.deleted;

    this.log(`  📊 Total settings deleted: ${totalDeleted}`);
    return totalDeleted;
  }

  /**
   * Cleanup orphaned data from dependent tables
   */
  public async cleanupOrphanedData(): Promise<void> {
    this.log('🧹 Cleaning up orphaned data...');

    const orphanQueries = [
      'DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)',
      'DELETE FROM user_profiles WHERE user_id NOT IN (SELECT id FROM users)',
      'DELETE FROM user_groups WHERE user_id NOT IN (SELECT id FROM users)',
      'DELETE FROM theme_settings WHERE theme_id NOT IN (SELECT id FROM themes)',
      'DELETE FROM user_theme_preferences WHERE user_id NOT IN (SELECT id FROM users)',
      'DELETE FROM user_theme_preferences WHERE theme_id NOT IN (SELECT id FROM themes)'
    ];

    for (const query of orphanQueries) {
      const result = await this.executeQueryWithCount(query);
      if (result.deleted > 0) {
        this.log(`  ✓ Cleaned ${result.deleted} orphaned entries from ${this.extractTableName(query)}`);
      }
    }

    this.log(`  ✓ Orphaned data cleanup completed`);
  }

  /**
   * Get IDs of admin users (users with admin role) - DISABLED: Users are now managed by external auth service
   */
  private async getAdminUserIds(): Promise<string[]> {
    this.log('⚠️  Admin user ID lookup disabled - users are now managed by external auth service');
    return [];
  }

  /**
   * Convert a DELETE query to a COUNT query
   */
  private convertDeleteToCount(deleteQuery: string): string {
    const trimmed = deleteQuery.trim();
    if (trimmed.toUpperCase().startsWith('DELETE')) {
      const match = trimmed.match(/^DELETE\s+FROM\s+(\w+)(\s+.*)?$/i);
      if (match) {
        const table = match[1];
        const where = match[2] || '';
        return `SELECT COUNT(*) as count FROM ${table}${where}`;
      }
      // Fallback: naive replacement
      return trimmed.replace(/^DELETE/i, 'SELECT COUNT(*) as count');
    }
    return deleteQuery;
  }

  /**
   * Execute a query and return the number of affected rows
   */
  private async executeQueryWithCount(
    query: string,
    params: (string | number | boolean | null)[] = []
  ): Promise<{ deleted: number }> {
    if (this.options.dryRun) {
      this.log(`[DRY RUN] ${query}`, params.length > 0 ? `params: ${JSON.stringify(params)}` : '');
      const countQuery = this.convertDeleteToCount(query);
      const result = await this.db.query(countQuery, params);
      if (result.success && result.data && result.data.length > 0) {
        const count = (result.data[0] as Record<string, unknown>).count;
        return { deleted: typeof count === 'number' ? count : 0 };
      }
      return { deleted: 0 };
    }

    // Real execution: perform DELETE then retrieve changes()
    const result = await this.db.query(query, params);
    if (!result.success) {
      return { deleted: 0 };
    }
    // Get affected rows count using SQLite changes()
    const changesResult = await this.db.query('SELECT changes() as count', []);
    const count = (changesResult.data?.[0] as Record<string, unknown>)?.count;
    const deleted = typeof count === 'number' ? count : 0;
    return { deleted };
  }

  /**
   * Extract table name from a DELETE query
   */
  private extractTableName(query: string): string {
    const match = query.match(/DELETE\s+FROM\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  /**
   * Simple logging helper
   */
  private log(...messages: unknown[]): void {
    console.log(messages.join(' '));
  }
}

/**
 * Convenience function to create and run a cleanup
 */
export async function cleanupTestData(
  db: DatabaseAdapter,
  options: CleanupOptions = {}
): Promise<IResolve<CleanupReport>> {
  const cleaner = new TestDataCleaner(db, options);
  return await cleaner.cleanup();
}

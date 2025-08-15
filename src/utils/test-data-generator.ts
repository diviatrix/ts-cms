import adapter from '../db-adapter/sqlite-adapter';

export class TestDataGenerator {
    private db: adapter;
    
    constructor() {
        this.db = new adapter();
    }

    /**
     * Create test data if database is empty
     */
    public async createTestDataIfNeeded(): Promise<void> {
        try {
            // Check if records already exist
            const recordsResult = await this.db.executeQuery('SELECT COUNT(*) as count FROM records', []);
            const recordCount = recordsResult.success && recordsResult.data?.[0] ? 
                (recordsResult.data[0] as { count: number }).count : 0;

            // Only create test data if no records exist
            if (recordCount === 0) {
                console.log('📝 Creating test data for pagination demo...');
                await this.insertTestRecords();
                console.log('✓ Test data created successfully');
            }
        } catch (error) {
            console.error('Failed to create test data:', error);
        }
    }

    /**
     * Insert test records with different categories and tags
     */
    private async insertTestRecords(): Promise<void> {
        // Get or create system user
        const systemUserResult = await this.db.executeQuery(
            "SELECT id FROM users WHERE login = 'system' LIMIT 1",
            []
        );
        
        const systemUserId = systemUserResult.success && systemUserResult.data && systemUserResult.data.length > 0
            ? (systemUserResult.data[0] as { id: string }).id
            : 'system';

        const categories = ['technology', 'programming', 'design'];
        const tags = ['javascript', 'typescript', 'react', 'nodejs', 'css', 'html', 'api', 'database', 'ui', 'ux'];
        
        const testRecords = [];
        
        // Generate 25 test records
        for (let i = 1; i <= 25; i++) {
            const categoryIndex = (i - 1) % categories.length;
            const category = categories[categoryIndex];
            
            // Randomly select 2-3 tags
            const recordTags = this.shuffleArray([...tags]).slice(0, Math.floor(Math.random() * 2) + 2);
            
            const record = {
                id: this.generateUUID(),
                title: `${category.charAt(0).toUpperCase() + category.slice(1)} Article #${i}: ${this.generateTitle(category)}`,
                description: this.generateDescription(category),
                content: this.generateContent(category, i),
                image_url: i % 4 === 0 ? `https://picsum.photos/800/400?random=${i}` : null,
                user_id: systemUserId,
                tags: JSON.stringify(recordTags),
                categories: JSON.stringify([category]),
                is_published: 1,
                created_at: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000).toISOString(), // Spread over 25 days
                updated_at: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000).toISOString()
            };
            
            testRecords.push(record);
        }
        
        // Insert records
        for (const record of testRecords) {
            const columns = Object.keys(record).join(', ');
            const placeholders = Object.keys(record).map(() => '?').join(', ');
            const values = Object.values(record);
            const query = `INSERT INTO records (${columns}) VALUES (${placeholders})`;
            
            await this.db.executeQuery(query, values);
        }
    }
    
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    private generateTitle(category: string): string {
        const titles = {
            technology: [
                'Latest Trends and Innovations',
                'Future of Digital Transformation',
                'Emerging Technologies in 2025',
                'AI and Machine Learning Advances',
                'Cloud Computing Revolution'
            ],
            programming: [
                'Clean Code Principles',
                'Design Patterns Explained',
                'Performance Optimization Tips',
                'Testing Strategies',
                'API Development Best Practices'
            ],
            design: [
                'User Experience Principles',
                'Modern UI Trends',
                'Color Theory in Practice',
                'Typography Guidelines',
                'Responsive Design Patterns'
            ]
        };
        
        const categoryTitles = titles[category as keyof typeof titles] || titles.technology;
        return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
    }
    
    private generateDescription(category: string): string {
        const descriptions = {
            technology: 'Exploring the latest technological developments and their impact on modern society.',
            programming: 'Deep dive into programming concepts, best practices, and development methodologies.',
            design: 'Comprehensive guide to modern design principles and user experience optimization.'
        };
        
        return descriptions[category as keyof typeof descriptions] || descriptions.technology;
    }
    
    private generateContent(category: string, index: number): string {
        const content = `# ${category.charAt(0).toUpperCase() + category.slice(1)} Excellence

This is a comprehensive guide to ${category} that demonstrates the pagination functionality of the CMS system.

## Key Points

- **Quality**: Focus on high-quality solutions and implementations
- **Innovation**: Embrace new approaches and methodologies  
- **Best Practices**: Follow industry standards and proven patterns

## Detailed Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

### Section 1

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.

### Section 2

Sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.

---

*This is test article #${index} created for pagination demonstration purposes.*`;

        return content;
    }
}
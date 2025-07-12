import { BasePageController } from './base-page-controller.js';
import { TabManager } from '../../components/tab-manager.js';

class AdminPanelController extends BasePageController {
    constructor() {
        super();
        this.container = document.getElementById('admin-tabs-container');
        this.init();
    }

    init() {
        const tabConfig = {
            initialTab: 'users',
            tabs: [
                {
                    id: 'users',
                    label: '👥 Users',
                    loader: async (panel) => {
                        const { UsersTab } = await import('../tabs/users-tab.js');
                        const controller = new UsersTab(panel);
                        await controller.load();
                        return controller;
                    }
                },
                {
                    id: 'records',
                    label: '📝 Records',
                    loader: async (panel) => {
                        const { RecordsTab } = await import('../tabs/records-tab.js');
                        const controller = new RecordsTab(panel);
                        await controller.load();
                        return controller;
                    }
                },
                {
                    id: 'themes',
                    label: '🎨 Themes',
                    loader: async (panel) => {
                        const { ThemesTab } = await import('../tabs/themes-tab.js');
                        const controller = new ThemesTab(panel);
                        await controller.load();
                        return controller;
                    }
                },
                {
                    id: 'settings',
                    label: '⚙️ Settings',
                    loader: async (panel) => {
                        const { SettingsTab } = await import('../tabs/settings-tab.js');
                        const controller = new SettingsTab(panel);
                        await controller.load();
                        return controller;
                    }
                }
            ]
        };

        new TabManager(this.container, tabConfig);
    }
}

export default AdminPanelController;

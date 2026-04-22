const routes = {
  '/': {
    title: 'Home',
    template: '<div id="records-container"></div>',
    controllerLoader: () => import('../main.js')
  },
  '/profile': {
    title: 'Profile',
    template: '<div id="profile-container"></div>',
    controllerLoader: () => import('../controllers/pages/profile-controller.js')
  },
  '/admin': {
    title: 'Admin Panel',
    template: '<div id="admin-panel-container"></div>',
    controllerLoader: () => import('../controllers/pages/admin-panel-controller.js')
  },
  '/record': {
    title: 'Record',
    template: '<div id="record-container"></div>',
    controllerLoader: () => import('../controllers/pages/single-record-controller.js')
  },
  '/records-manage': {
    title: 'Manage Records',
    template: '<div id="records-manage-container"></div>',
    controllerLoader: () => import('../controllers/pages/records-manage-controller.js')
  },
  '/settings': {
    title: 'Settings',
    template: '<div id="settings-container"></div>',
    controllerLoader: () => import('../controllers/pages/settings-controller.js')
  },
  '/themes-manage': {
    title: 'Manage Themes',
    template: '<div id="themes-manage-container"></div>',
    controllerLoader: () => import('../controllers/pages/themes-manage-controller.js')
  },
  '/theme-editor': {
    title: 'Theme Editor',
    template: '<div id="theme-editor-container"></div>',
    controllerLoader: () => import('../controllers/pages/theme-editor-controller.js')
  },
  '/record-editor': {
    title: 'Record Editor',
    template: '<div id="record-editor-container"></div>',
    controllerLoader: () => import('../controllers/pages/record-editor-controller.js')
  },
  '/users-manage': {
    title: 'Manage Users',
    template: '<div id="users-manage-container"></div>',
    controllerLoader: () => import('../controllers/pages/users-manage-controller.js')
  },
  '/user-editor': {
    title: 'User Editor',
    template: '<div id="user-editor-container"></div>',
    controllerLoader: () => import('../controllers/pages/user-editor-controller.js')
  },
  '/invites-manage': {
    title: 'Manage Invites',
    template: '<div id="invites-manage-container"></div>',
    controllerLoader: () => import('../controllers/pages/invites-manage-controller.js')
  }
};

export default routes;

export class AdminUtils {
    // Accepts a root container to scope queries for dynamic tab content
    static getDOMElements(root = document) {
        return {
            // User management elements
            userListContainer: root.querySelector('#userListContainer'),
            profileEditTab: root.querySelector('#profileEditTab'),
            adminProfileInfo: root.querySelector('#adminProfileInfo'),
            adminMessageDiv: root.querySelector('#adminMessageDiv'),
            adminServerAnswerTextarea: root.querySelector('#adminServerAnswerTextarea'),
            adminSaveButton: root.querySelector('#adminSaveButton'),

            // Record management elements
            recordListContainer: root.querySelector('#recordListContainer'),
            recordEditTab: root.querySelector('#recordEditTab'),
            recordInfo: root.querySelector('#recordInfo'),
            recordTitle: root.querySelector('#recordTitle'),
            recordDescription: root.querySelector('#recordDescription'),
            recordImageUrl: root.querySelector('#recordImageUrl'),
            recordContent: root.querySelector('#recordContent'),
            recordTags: root.querySelector('#recordTags'),
            recordCategories: root.querySelector('#recordCategories'),
            recordIsPublished: root.querySelector('#recordIsPublished'),
            recordMessageDiv: root.querySelector('#recordMessageDiv'),
            newRecordButton: root.querySelector('#newRecordButton'),
            recordSaveButton: root.querySelector('#recordSaveButton'),
            recordDeleteButton: root.querySelector('#recordDeleteButton'),
            recordDownloadButton: root.querySelector('#recordDownloadButton'),

            // Tab elements (these are global, so still use document)
            usersTabBtn: document.getElementById('users-tab'),
            recordsTabBtn: document.getElementById('records-tab')
        };
    }


}

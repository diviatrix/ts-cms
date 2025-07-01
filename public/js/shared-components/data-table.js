/**
 * Data Table Component
 * Reusable table with sorting, filtering, and pagination
 */

/**
 * Data Table Component
 * Reusable table with sorting, filtering, and pagination
 */
class DataTable {
    constructor(container, options = {}) {
        this.container = container;
        this.data = options.data || [];
        this.columns = options.columns || [];
        this.sortable = options.sortable !== false;
        this.filterable = options.filterable !== false;
        this.pagination = options.pagination || { enabled: false, pageSize: 10 };
        
        this.currentSort = { column: null, direction: 'asc' };
        this.currentFilter = '';
        this.currentPage = 1;
        
        this.render();
    }

    /**
     * Render the table
     */
    render() {
        if (!this.container) return;

        const filteredData = this.getFilteredData();
        const sortedData = this.getSortedData(filteredData);
        const paginatedData = this.getPaginatedData(sortedData);

        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    ${this.renderHeader()}
                    ${this.renderBody(paginatedData)}
                </table>
            </div>
            ${this.pagination.enabled ? this.renderPagination(filteredData.length) : ''}
        `;

        this.attachEventListeners();
    }

    /**
     * Render filter input
     */
    renderFilter() {
        return `
            <div class="mb-3">
                <input type="text" class="form-control" id="tableFilter" 
                       placeholder="Filter data..." value="${this.currentFilter}">
            </div>
        `;
    }

    /**
     * Render table header
     */
    renderHeader() {
        const headers = this.columns.map(column => {
            const sortIcon = this.currentSort.column === column.key 
                ? (this.currentSort.direction === 'asc' ? '↑' : '↓')
                : '';
                
            const sortClass = this.sortable ? 'sortable' : '';
            
            return `
                <th class="${sortClass}" data-sort="${column.key}">
                    ${column.title} ${sortIcon}
                </th>
            `;
        }).join('');

        return `<thead><tr>${headers}</tr></thead>`;
    }

    /**
     * Render table body
     */
    renderBody(data) {
        if (data.length === 0) {
            return `
                <tbody>
                    <tr>
                        <td colspan="${this.columns.length}" class="text-center text-muted">
                            No data available
                        </td>
                    </tr>
                </tbody>
            `;
        }

        const rows = data.map(row => {
            const cells = this.columns.map(column => {
                const value = row[column.key];
                const displayValue = column.render ? column.render(value, row) : value;
                return `<td>${displayValue || ''}</td>`;
            }).join('');

            return `<tr>${cells}</tr>`;
        }).join('');

        return `<tbody>${rows}</tbody>`;
    }

    /**
     * Render pagination
     */
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pagination.pageSize);
        if (totalPages <= 1) return '';

        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            const active = i === this.currentPage ? 'active' : '';
            pages.push(`
                <li class="page-item ${active}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }

        return `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div>
                    Showing ${((this.currentPage - 1) * this.pagination.pageSize) + 1} to 
                    ${Math.min(this.currentPage * this.pagination.pageSize, totalItems)} of ${totalItems} entries
                </div>
                <nav>
                    <ul class="pagination mb-0">
                        ${pages.join('')}
                    </ul>
                </nav>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Filter functionality
        const filterInput = this.container.querySelector('#tableFilter');
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.currentFilter = e.target.value;
                this.currentPage = 1;
                this.render();
            });
        }

        // Sort functionality
        if (this.sortable) {
            this.container.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.dataset.sort;
                    if (this.currentSort.column === column) {
                        this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.currentSort.column = column;
                        this.currentSort.direction = 'asc';
                    }
                    this.render();
                });
            });
        }

        // Pagination functionality
        this.container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = parseInt(e.target.dataset.page);
                this.render();
            });
        });
    }

    /**
     * Get filtered data
     */
    getFilteredData() {
        if (!this.currentFilter) return this.data;

        return this.data.filter(item => {
            return this.columns.some(column => {
                const value = item[column.key];
                return value && value.toString().toLowerCase().includes(this.currentFilter.toLowerCase());
            });
        });
    }

    /**
     * Get sorted data
     */
    getSortedData(data) {
        if (!this.currentSort.column) return data;

        return [...data].sort((a, b) => {
            const aVal = a[this.currentSort.column];
            const bVal = b[this.currentSort.column];

            if (aVal === bVal) return 0;

            const comparison = aVal < bVal ? -1 : 1;
            return this.currentSort.direction === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * Get paginated data
     */
    getPaginatedData(data) {
        if (!this.pagination.enabled) return data;

        const startIndex = (this.currentPage - 1) * this.pagination.pageSize;
        const endIndex = startIndex + this.pagination.pageSize;
        return data.slice(startIndex, endIndex);
    }

    /**
     * Update table data
     */
    updateData(newData) {
        this.data = newData;
        this.currentPage = 1;
        this.render();
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading data...') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped">
                    ${this.renderHeader()}
                    <tbody>
                        <tr>
                            <td colspan="${this.columns.length}" class="text-center py-4">
                                <div class="d-flex align-items-center justify-content-center">
                                    <div class="spinner-border spinner-border-sm me-2" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span class="text-muted">${message}</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Show empty state
     */
    showEmpty(message = 'No data available') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped">
                    ${this.renderHeader()}
                    <tbody>
                        <tr>
                            <td colspan="${this.columns.length}" class="text-center py-4 text-muted">
                                <i class="bi bi-inbox me-2"></i>
                                ${message}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showError(message = 'Failed to load data') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped">
                    ${this.renderHeader()}
                    <tbody>
                        <tr>
                            <td colspan="${this.columns.length}" class="text-center py-4">
                                <div class="text-danger">
                                    <i class="bi bi-exclamation-circle me-2"></i>
                                    ${message}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
}

export { DataTable };

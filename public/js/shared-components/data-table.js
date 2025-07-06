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
        this.pagination = { enabled: false, pageSize: 10, ...options.pagination };
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
        const filtered = this.getFilteredData();
        const sorted = this.getSortedData(filtered);
        const paginated = this.getPaginatedData(sorted);
        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    ${this.renderHeader()}
                    ${this.renderBody(paginated)}
                </table>
            </div>
            ${this.pagination.enabled ? this.renderPagination(filtered.length) : ''}
        `;
        this.attachEventListeners();
    }

    /**
     * Render filter input
     */
    renderFilter() {
        return `<div class="mb-3"><input type="text" class="form-control" id="tableFilter" placeholder="Filter..." value="${this.currentFilter}"></div>`;
    }

    /**
     * Render table header
     */
    renderHeader() {
        return `<thead><tr>${
            this.columns.map(col => 
                `<th class="${this.sortable ? 'sortable' : ''}" data-sort="${col.key}">
                    ${col.title} ${this.currentSort.column === col.key ? (this.currentSort.direction === 'asc' ? '↑' : '↓') : ''}
                </th>`
            ).join('')
        }</tr></thead>`;
    }

    /**
     * Render table body
     */
    renderBody(data) {
        if (!data.length) return `<tbody><tr><td colspan="${this.columns.length}" class="text-center text-muted">No data</td></tr></tbody>`;
        return `<tbody>${
            data.map(row => `<tr>${
                this.columns.map(col => `<td>${col.render ? col.render(row[col.key], row) : row[col.key] || ''}</td>`).join('')
            }</tr>`).join('')
        }</tbody>`;
    }

    /**
     * Render pagination
     */
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pagination.pageSize);
        if (totalPages <= 1) return '';
        return `<nav><ul class="pagination mb-0">${
            Array.from({ length: totalPages }, (_, i) => 
                `<li class="page-item${i+1 === this.currentPage ? ' active' : ''}">
                    <a class="page-link" href="#" data-page="${i+1}">${i+1}</a>
                </li>`
            ).join('')
        }</ul></nav>`;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Filter
        const filterInput = this.container.querySelector('#tableFilter');
        if (filterInput) filterInput.addEventListener('input', e => {
            this.currentFilter = e.target.value;
            this.currentPage = 1;
            this.render();
        });
        // Sort
        this.container.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.sort;
                this.currentSort.direction = this.currentSort.column === col && this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                this.currentSort.column = col;
                this.render();
            });
        });
        // Pagination
        this.container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', e => {
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
        return this.data.filter(item => this.columns.some(col => 
            (item[col.key] || '').toString().toLowerCase().includes(this.currentFilter.toLowerCase())
        ));
    }

    /**
     * Get sorted data
     */
    getSortedData(data) {
        if (!this.currentSort.column) return data;
        return [...data].sort((a, b) => {
            const aVal = a[this.currentSort.column], bVal = b[this.currentSort.column];
            return aVal === bVal ? 0 : (aVal < bVal ? -1 : 1) * (this.currentSort.direction === 'asc' ? 1 : -1);
        });
    }

    /**
     * Get paginated data
     */
    getPaginatedData(data) {
        if (!this.pagination.enabled) return data;
        const start = (this.currentPage - 1) * this.pagination.pageSize;
        return data.slice(start, start + this.pagination.pageSize);
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
    showState(type, message) {
        this.container.innerHTML = `<div class="alert alert-${type} text-center">${message}</div>`;
    }
}

export { DataTable };

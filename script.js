$(document).ready(function() {
            const today = new Date().toISOString().split('T')[0];
            $('#date').val(today);
            $('#editDate').val(today);
            $('#current-date').text(new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }));

            let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
            let editingId = null;

            function updateStats() {
                const totalExpenses = expenses
                    .filter(expense => expense.type === 'expense')
                    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                
                const totalIncome = expenses
                    .filter(expense => expense.type === 'income')
                    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                
                const balance = totalIncome - totalExpenses;
                
                $('#total-expenses').text('₹' + totalExpenses.toFixed(2));
                $('#total-income').text('₹' + totalIncome.toFixed(2));
                $('#current-balance').text('₹' + balance.toFixed(2));
            }

            function renderExpenses(filteredExpenses = expenses) {
                const tableBody = $('#expensesTable');
                tableBody.empty();
                
                if (filteredExpenses.length === 0) {
                    $('#noExpensesMessage').show();
                    return;
                }
                
                $('#noExpensesMessage').hide();
                
                filteredExpenses.forEach(expense => {
                    const row = $(`
                        <tr class="transaction-item" data-id="${expense.id}">
                            <td>
                                <div class="d-flex align-items-center">
                                    <span class="category-icon">${getCategoryIcon(expense.category)}</span>
                                    <div>
                                        <strong>${expense.description}</strong>
                                        <div class="text-muted small">${expense.description.toLowerCase().includes('payment') ? 'Payment' : expense.description.toLowerCase().includes('salary') ? 'Payroll' : 'General'}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <strong class="${expense.type === 'income' ? 'text-success' : 'text-danger'}">
                                    ${expense.type === 'income' ? '+' : '-'}₹${parseFloat(expense.amount).toFixed(2)}
                                </strong>
                            </td>
                            <td>
                                <span class="expense-badge expense-${expense.type}">
                                    <i class="fas fa-${expense.type === 'income' ? 'arrow-up' : 'arrow-down'} me-1"></i>
                                    ${expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                                </span>
                            </td>
                            <td>${formatCategory(expense.category)}</td>
                            <td>${new Date(expense.date).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary action-btn edit-btn" data-id="${expense.id}" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger action-btn delete-btn" data-id="${expense.id}" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `);
                    tableBody.append(row);
                });
                
                attachEventHandlers();
            }

            function getCategoryIcon(category) {
                const icons = {
                    'food': '🍽️',
                    'transport': '🚗',
                    'shopping': '🛍️',
                    'entertainment': '🎬',
                    'utilities': '💡',
                    'healthcare': '🏥',
                    'salary': '💼',
                    'other': '📦'
                };
                return icons[category] || '📦';
            }

            function formatCategory(category) {
                const categories = {
                    'food': '🍽️ Food & Dining',
                    'transport': '🚗 Transportation',
                    'shopping': '🛍️ Shopping',
                    'entertainment': '🎬 Entertainment',
                    'utilities': '💡 Utilities',
                    'healthcare': '🏥 Healthcare',
                    'salary': '💼 Salary',
                    'other': '📦 Other'
                };
                return categories[category] || category;
            }

            function attachEventHandlers() {
                $('.edit-btn').off('click').on('click', function() {
                    const id = $(this).data('id');
                    const expense = expenses.find(e => e.id === id);
                    
                    if (expense) {
                        $('#editId').val(expense.id);
                        $('#editDescription').val(expense.description);
                        $('#editAmount').val(expense.amount);
                        $('#editType').val(expense.type);
                        $('#editCategory').val(expense.category);
                        $('#editDate').val(expense.date);
                        
                        editingId = id;
                        $('#editModal').modal('show');
                    }
                });

                $('.delete-btn').off('click').on('click', function() {
                    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
                        const id = $(this).data('id');
                        expenses = expenses.filter(expense => expense.id !== id);
                        localStorage.setItem('expenses', JSON.stringify(expenses));
                        renderExpenses();
                        updateStats();
                    }
                });
            }

            $('#expenseForm').on('submit', function(e) {
                e.preventDefault();
                
                const newExpense = {
                    id: Date.now(),
                    description: $('#description').val(),
                    amount: parseFloat($('#amount').val()),
                    type: $('#type').val(),
                    category: $('#category').val(),
                    date: $('#date').val()
                };
                
                expenses.push(newExpense);
                localStorage.setItem('expenses', JSON.stringify(expenses));
                
                renderExpenses();
                updateStats();
                
                // Reset form with animation
                $('#expenseForm')[0].reset();
                $('#date').val(today);
                
                // Show success animation
                const originalText = $('.btn-primary').html();
                $('.btn-primary').html('<i class="fas fa-check me-2"></i>Added!').addClass('btn-success');
                setTimeout(() => {
                    $('.btn-primary').html(originalText).removeClass('btn-success');
                }, 2000);
            });

            $('#resetForm').on('click', function() {
                $('#expenseForm')[0].reset();
                $('#date').val(today);
            });

            $('#saveEdit').on('click', function() {
                const updatedExpense = {
                    id: parseInt($('#editId').val()),
                    description: $('#editDescription').val(),
                    amount: parseFloat($('#editAmount').val()),
                    type: $('#editType').val(),
                    category: $('#editCategory').val(),
                    date: $('#editDate').val()
                };
                
                const index = expenses.findIndex(expense => expense.id === updatedExpense.id);
                if (index !== -1) {
                    expenses[index] = updatedExpense;
                    localStorage.setItem('expenses', JSON.stringify(expenses));
                    renderExpenses();
                    updateStats();
                    $('#editModal').modal('hide');
                    
                    // Show success message
                    const originalText = $('#saveEdit').html();
                    $('#saveEdit').html('<i class="fas fa-check me-2"></i>Saved!').addClass('btn-success');
                    setTimeout(() => {
                        $('#saveEdit').html(originalText).removeClass('btn-success');
                    }, 2000);
                }
            });

            // Search functionality
            $('#searchInput').on('input', function() {
                const searchTerm = $(this).val().toLowerCase();
                const filtered = expenses.filter(expense => 
                    expense.description.toLowerCase().includes(searchTerm) ||
                    expense.category.toLowerCase().includes(searchTerm) ||
                    expense.amount.toString().includes(searchTerm)
                );
                renderExpenses(filtered);
            });

            // Initialize
            updateStats();
            renderExpenses();

            // Add sample data if empty
            if (expenses.length === 0) {
                const sampleExpenses = [
                    { id: 1, description: 'Grocery Shopping', amount: 85.50, type: 'expense', category: 'food', date: today },
                    { id: 2, description: 'Monthly Salary', amount: 3500.00, type: 'income', category: 'salary', date: today },
                    { id: 3, description: 'Gas Station', amount: 45.00, type: 'expense', category: 'transport', date: today },
                    { id: 4, description: 'Netflix Subscription', amount: 15.99, type: 'expense', category: 'entertainment', date: today }
                ];
                expenses = sampleExpenses;
                localStorage.setItem('expenses', JSON.stringify(expenses));
                renderExpenses();
                updateStats();
            }
        });
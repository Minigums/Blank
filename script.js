document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const themeToggle = document.querySelector('.theme-toggle');
    const floatingToolbar = document.querySelector('.floating-toolbar');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const closeSidebar = document.querySelector('.close-sidebar');
    const pageList = document.querySelector('.page-list');
    const addPageBtn = document.querySelector('.add-page');
    const pageTitle = document.querySelector('.page-title');

    // Toggle sidebar
    function toggleSidebar(show) {
        if (show) {
            overlay.classList.add('visible');
            sidebar.classList.add('visible');
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.remove('visible');
            sidebar.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }

    // --- Page Management ---
    function getPages() {
        return JSON.parse(localStorage.getItem('pages') || '{}');
    }
    function setPages(pages) {
        localStorage.setItem('pages', JSON.stringify(pages));
    }
    function getCurrentPageId() {
        return localStorage.getItem('currentPageId');
    }
    function setCurrentPageId(id) {
        localStorage.setItem('currentPageId', id);
    }
    function renderPageList() {
        const pages = getPages();
        const currentId = getCurrentPageId();
        pageList.innerHTML = '';
        Object.entries(pages).forEach(([id, page]) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="page-name">${page.title}</span>
                <div class="page-actions">
                    <button class="more-button" title="More options">⋮</button>
                    <div class="page-dropdown">
                        <button class="rename">Rename</button>
                        <button class="delete">Delete</button>
                    </div>
                </div>
            `;
            li.dataset.pageId = id;
            if (id === currentId) li.classList.add('active');

            // Page click handler
            li.querySelector('.page-name').onclick = () => {
                saveCurrentPageContent();
                setCurrentPageId(id);
                loadCurrentPage();
                toggleSidebar(false);
            };

            // More button click handler
            const moreButton = li.querySelector('.more-button');
            const dropdown = li.querySelector('.page-dropdown');
            moreButton.onclick = (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('visible');
            };

            // Rename button handler
            li.querySelector('.rename').onclick = (e) => {
                e.stopPropagation();
                const pageName = li.querySelector('.page-name');
                const currentTitle = pageName.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentTitle;
                input.className = 'page-title-input';
                input.style.width = '100%';
                input.style.padding = '4px';
                input.style.border = '1px solid var(--border-color)';
                input.style.borderRadius = '4px';
                input.style.background = 'transparent';
                input.style.color = 'var(--text-color)';
                pageName.replaceWith(input);
                input.focus();
                input.select();

                function saveTitle() {
                    const newTitle = input.value.trim() || 'Untitled';
                    const pages = getPages();
                    if (pages[id]) {
                        pages[id].title = newTitle;
                        setPages(pages);
                    }
                    const newPageName = document.createElement('span');
                    newPageName.className = 'page-name';
                    newPageName.textContent = newTitle;
                    input.replaceWith(newPageName);
                    if (id === currentId) {
                        pageTitle.textContent = newTitle;
                    }
                    renderPageList();
                }

                input.addEventListener('blur', saveTitle);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        input.blur();
                    } else if (e.key === 'Escape') {
                        const newPageName = document.createElement('span');
                        newPageName.className = 'page-name';
                        newPageName.textContent = currentTitle;
                        input.replaceWith(newPageName);
                    }
                });
            };

            // Delete button handler
            li.querySelector('.delete').onclick = (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this page?')) {
                    const pages = getPages();
                    delete pages[id];
                    setPages(pages);
                    if (id === currentId) {
                        const firstPageId = Object.keys(pages)[0];
                        if (firstPageId) {
                            setCurrentPageId(firstPageId);
                            loadCurrentPage();
                        } else {
                            createNewPage();
                        }
                    }
                    renderPageList();
                }
            };

            pageList.appendChild(li);
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.page-actions')) {
                document.querySelectorAll('.page-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('visible');
                });
            }
        });
    }
    function saveCurrentPageContent() {
        const id = getCurrentPageId();
        if (!id) return;
        const pages = getPages();
        if (pages[id]) {
            pages[id].content = editor.innerHTML;
            setPages(pages);
        }
    }
    function loadCurrentPage() {
        const pages = getPages();
        const id = getCurrentPageId();
        if (pages[id]) {
            editor.innerHTML = pages[id].content || '';
            // Update the header title
            if (pageTitle) {
                pageTitle.textContent = pages[id].title;
            }
        } else {
            editor.innerHTML = '';
            if (pageTitle) {
                pageTitle.textContent = '';
            }
        }
        renderPageList();
    }
    function createNewPage() {
        const pages = getPages();
        let pageNum = Object.keys(pages).length + 1;
        let title = `Untitled ${pageNum}`;
        // Ensure unique title
        while (Object.values(pages).some(p => p.title === title)) {
            pageNum++;
            title = `Untitled ${pageNum}`;
        }
        const id = 'page-' + Date.now();
        pages[id] = { title, content: '' };
        setPages(pages);
        setCurrentPageId(id);
        loadCurrentPage();
        toggleSidebar(false);
        // Update the header title
        if (pageTitle) {
            pageTitle.textContent = title;
        }
    }

    // Initial page setup
    if (!getCurrentPageId() || !getPages()[getCurrentPageId()]) {
        createNewPage();
    } else {
        loadCurrentPage();
    }

    // Save content on input
    editor.addEventListener('input', () => {
        saveCurrentPageContent();
    });

    // Sidebar controls
    hamburgerMenu.addEventListener('click', () => {
        renderPageList();
        toggleSidebar(true);
    });
    closeSidebar.addEventListener('click', () => toggleSidebar(false));
    overlay.addEventListener('click', () => toggleSidebar(false));
    addPageBtn.addEventListener('click', createNewPage);

    // --- Theme toggle functionality ---
    const setTheme = (isDark) => {
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        setTheme(!isDark);
    });

    // --- Floating toolbar ---
    const showFloatingToolbar = (selection) => {
        if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
            floatingToolbar.classList.remove('visible');
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position the toolbar above the selection
        const toolbarRect = floatingToolbar.getBoundingClientRect();
        let top = rect.top - toolbarRect.height - 5 + window.scrollY; // Position 5px above selection
        let left = rect.left + (rect.width / 2) - (toolbarRect.width / 2) + window.scrollX;

        // Keep toolbar within viewport (basic check)
        if (top < 0) {
            top = rect.bottom + 5 + window.scrollY; // Position below if not enough space above
        }
        if (left < 0) {
            left = 0;
        } else if (left + toolbarRect.width > window.innerWidth) {
            left = window.innerWidth - toolbarRect.width;
        }

        floatingToolbar.style.top = `${top}px`;
        floatingToolbar.style.left = `${left}px`;
        floatingToolbar.classList.add('visible');

        // Update active states of buttons
        updateToolbarButtonStates();
    };

    const hideFloatingToolbar = () => {
        floatingToolbar.classList.remove('visible');
    };

    // Function to update button active states
    const updateToolbarButtonStates = () => {
        if (!document.queryCommandSupported('bold')) return; // Check if commands are supported

        floatingToolbar.querySelectorAll('.tool-btn').forEach(button => {
            const command = button.dataset.command;
            if (command && document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    };

    editor.addEventListener('mouseup', () => {
        // Allow a small delay to ensure selection is registered
        setTimeout(() => {
            const selection = window.getSelection();
            showFloatingToolbar(selection);
        }, 50);
    });

    editor.addEventListener('keyup', () => {
        const selection = window.getSelection();
        showFloatingToolbar(selection);
    });

    document.addEventListener('mousedown', (e) => {
        // Hide toolbar if click is outside editor and toolbar
        if (!editor.contains(e.target) && !floatingToolbar.contains(e.target)) {
            hideFloatingToolbar();
        }
    });

    // Handle toolbar button clicks
    floatingToolbar.addEventListener('click', (e) => {
        const button = e.target.closest('.tool-btn');
        if (!button) return;
        const command = button.dataset.command;
        if (!command) return;

        e.preventDefault();

        // Execute command and immediately update button states
        document.execCommand(command, false, null);
        updateToolbarButtonStates();
        saveCurrentPageContent(); // Save after formatting
    });

    // Handle keyboard shortcuts
    editor.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            let command = null;
            switch (e.key.toLowerCase()) {
                case 'b':
                    command = 'bold';
                    break;
                case 'i':
                    command = 'italic';
                    break;
                case 'u':
                    command = 'underline';
                    break;
            }

            if (command) {
                e.preventDefault();
                document.execCommand(command, false, null);
                // Update button states after shortcut
                updateToolbarButtonStates();
                saveCurrentPageContent(); // Save after formatting
            }
        }
    });

    // Update toolbar state on editor focus and selection change
    editor.addEventListener('focus', () => {
         const selection = window.getSelection();
         showFloatingToolbar(selection);
    });

     editor.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        // Add a small delay to ensure selection is stable, but not too long
        setTimeout(() => {
             // Check if the selection is still within the editor
            if (window.getSelection().anchorNode && editor.contains(window.getSelection().anchorNode)) {
                 showFloatingToolbar(window.getSelection());
            } else {
                hideFloatingToolbar();
            }
        }, 10);
     });

    // --- Page Title Rename ---
    if (pageTitle) {
        pageTitle.addEventListener('dblclick', () => {
            const currentTitle = pageTitle.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentTitle;
            input.className = 'page-title-input';
            input.style.fontSize = '1.3rem';
            input.style.fontWeight = 'bold';
            input.style.marginLeft = '12px';
            input.style.color = 'var(--text-color)';
            input.style.background = 'transparent';
            input.style.border = '1px solid var(--border-color)';
            input.style.borderRadius = '4px';
            input.style.padding = '2px 6px';
            input.style.outline = 'none';
            pageTitle.replaceWith(input);
            input.focus();
            input.select();

            function saveTitle() {
                const newTitle = input.value.trim() || 'Untitled';
                const pages = getPages();
                const id = getCurrentPageId();
                if (pages[id]) {
                    pages[id].title = newTitle;
                    setPages(pages);
                }
                // Replace input with span
                pageTitle.textContent = newTitle;
                input.replaceWith(pageTitle);
                renderPageList();
            }

            input.addEventListener('blur', saveTitle);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                } else if (e.key === 'Escape') {
                    input.replaceWith(pageTitle);
                }
            });
        });
    }
}); 
  let isnotsearched = true;
    let currentSearchKeywords = "";
    let currentPage = 1;
    let cachedJsonData = null;

    function back() {
      if (isnotsearched) {
        const resultDiv = document.querySelector('.list-of-result');
        resultDiv.classList.remove('show');
        setTimeout(() => {
          resultDiv.style.display = 'none';
          resultDiv.innerHTML = '';
          document.querySelector('.search-form').style.display = 'block';
        }, 500);
      } else {
        showCategory();
      }
    }

function email(itemToFetch, button) {
  const originalTextt = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>';

  if (!itemToFetch || !itemToFetch.link) {
    alert("لینک نامعتبر برای استخراج ایمیل");
    button.disabled = false;
    button.innerHTML = originalTextt;
    return;
  }

  fetch("https://ai.roha-ai.ir/extract-full", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: itemToFetch.link })
  })
  .then(response => {
    if (!response.ok) throw new Error(`خطا: ${response.status}`);

    // --- Extract filename from Content-Disposition header ---
    const disposition = response.headers.get('Content-Disposition');
    let filename = "downloaded_file"; // fallback default
    if (disposition && disposition.includes('attachment')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    return response.blob().then(blob => ({ blob, filename }));
  })
  .then(({ blob, filename }) => {
    button.disabled = false;
    button.innerHTML = originalTextt;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; // not hardcoded!
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  })
  .catch(error => {
    alert("خطا در استخراج ایمیل: " + error.message);
    button.disabled = false;
    button.innerHTML = originalTextt;
  });
}

    function showCategory(jsonData) {
      isnotsearched = true;
      if (jsonData) cachedJsonData = jsonData;
      else jsonData = cachedJsonData;

      const resultDiv = document.querySelector('.list-of-result');
      resultDiv.innerHTML = '';
      document.querySelector('.search-form').style.display = 'none';
      resultDiv.style.display = 'block';
      setTimeout(() => resultDiv.classList.add('show'), 10);

      const backButton = document.createElement('button');
      backButton.className = 'back';
      backButton.textContent = 'بازگشت';
      backButton.onclick = back;
      resultDiv.appendChild(backButton);

      const printButton = document.createElement('button');
      printButton.textContent = 'Print / Export as PDF';
      printButton.onclick = () => window.print();
      resultDiv.appendChild(printButton);

      const ul = document.createElement('ul');
      ul.style.listStyleType = 'disc';
      ul.style.paddingRight = '20px';
      ul.style.direction = 'rtl';

      jsonData.target_customers.forEach(item => {
        const li = document.createElement('li');
        li.style.marginBottom = '10px';
        li.style.cursor = 'pointer';
        li.innerHTML = `<strong>دسته‌بندی:</strong> ${item.category}<br>
                        <strong>دلیل:</strong> ${item.reason}<br>
                        <strong>کلمات کلیدی جستجو:</strong> ${item.search_keywords}`;
        li.addEventListener('click', () => {
          currentSearchKeywords = item.search_keywords;
          currentPage = 1;
          fetchPage(resultDiv);
        });
        ul.appendChild(li);
      });

      resultDiv.appendChild(ul);
    }

    function renderSearchResults(resultDiv, data) {
      resultDiv.innerHTML = '';
 
      const backButton = document.createElement('button');
      backButton.className = 'back';
      backButton.textContent = 'بازگشت';
      backButton.onclick = back;
      resultDiv.appendChild(backButton);

      const printButton = document.createElement('button');
      printButton.textContent = 'Print / Export as PDF';
      printButton.onclick = () => window.print();
      resultDiv.appendChild(printButton);

      const searchUl = document.createElement('ul');
      searchUl.style.listStyleType = 'disc';
      searchUl.style.paddingRight = '20px';
      searchUl.style.direction = 'rtl';

      const blockedWebsites = ['amazon', 'ebay', 'craigslist', 'instagram', 'facebook','wikipedia'];

      data.forEach(item => {
        isnotsearched = false
        if (blockedWebsites.some(site => item.link.includes(site))) return;

        const li = document.createElement('li');
        li.style.marginBottom = '10px';
        li.innerHTML = `<strong>عنوان:</strong> <a href="${item.link}" target="_blank">${item.title}</a><br>
                        <strong>توضیحات:</strong> ${item.snippet}`;
        const emailBtn = document.createElement('button');
        emailBtn.className = 'email';
        emailBtn.textContent = 'extract all info';
        emailBtn.onclick = (e) => email(item, e.target);
        li.appendChild(emailBtn);
        searchUl.appendChild(li);
      });

      resultDiv.appendChild(searchUl);
      createPagination(resultDiv, 5); // adjust 5 to dynamic total pages if available
    }

    function fetchPage(resultDiv) {
      fetch('https://my-money-plan.messagersr.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: currentSearchKeywords, page: currentPage }),
      })
      .then(response => response.json())
      .then(data => {
        renderSearchResults(resultDiv, data);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('خطا در دریافت اطلاعات.');
      });
    }

    function createPagination(resultDiv, totalPages = 5) {
      const paginationContainer = document.createElement('div');
      paginationContainer.className = 'pagination';

      const prevBtn = document.createElement('button');
      prevBtn.textContent = '◀';
      prevBtn.disabled = currentPage === 1;
      prevBtn.onclick = () => {
        currentPage--;
        fetchPage(resultDiv);
      };
      paginationContainer.appendChild(prevBtn);

      let maxVisible = 5;
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      if (startPage > 1) {
        addPageButton(paginationContainer, 1, resultDiv);
        if (startPage > 2) paginationContainer.appendChild(document.createTextNode("..."));
      }

      for (let i = startPage; i <= endPage; i++) {
        addPageButton(paginationContainer, i, resultDiv);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationContainer.appendChild(document.createTextNode("..."));
        addPageButton(paginationContainer, totalPages, resultDiv);
      }

      const nextBtn = document.createElement('button');
      nextBtn.textContent = '▶';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.onclick = () => {
        currentPage++;
        fetchPage(resultDiv);
      };
      paginationContainer.appendChild(nextBtn);

      resultDiv.appendChild(paginationContainer);
    }

    function addPageButton(container, page, resultDiv) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = page;
      if (page === currentPage) {
        pageBtn.classList.add('active-page');
        pageBtn.disabled = true;
      }
      pageBtn.onclick = () => {
        currentPage = page;
        fetchPage(resultDiv);
      };
      container.appendChild(pageBtn);
    }

    function checkLogin() {
      const product = document.getElementById('product').value.trim();
      const country = document.getElementById('country').value.trim();
      const searchButton = document.getElementById('search-button');
      const originalText = searchButton.innerHTML;

      if (!product) return alert("لطفا کالا را وارد کنید.");
      if (!country) return alert("لطفا کشور را وارد کنید.");

      searchButton.disabled = true;
      searchButton.innerHTML = '<span class="spinner"></span>';

      fetch('https://my-money-plan.messagersr.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, country }),
      })
      .then(response => response.text())
      .then(text => {
        searchButton.disabled = false;
        searchButton.innerHTML = originalText;
        const cleanText = text.replace(/```json|```/g, '');
        const jsonData = JSON.parse(cleanText);
        showCategory(jsonData);
      })
      .catch(error => {
        searchButton.disabled = false;
        searchButton.innerHTML = originalText;
        alert("خطایی رخ داده است: " + error.message);
      });
    }
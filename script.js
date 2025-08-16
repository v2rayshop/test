let isnotsearched = true;
    let currentSearchKeywords = "";
    let currentPage = 1;
    let cachedJsonData = null;

    function switchStylesheet(showList) {
      const head = document.head;
      let styleLink = document.querySelector('link[rel="stylesheet"][href="style.css"]');
      let stylesLink = document.querySelector('link[rel="stylesheet"][href="styles.css"]');

      if (showList) {
        // Show: use style.css, remove styles.css
        if (!styleLink) {
          styleLink = document.createElement('link');
          styleLink.rel = 'stylesheet';
          styleLink.href = 'style.css';
          head.appendChild(styleLink);
        }
        if (stylesLink) stylesLink.remove();
      } else {
        // Hide: use styles.css, remove style.css
        if (!stylesLink) {
          stylesLink = document.createElement('link');
          stylesLink.rel = 'stylesheet';
          stylesLink.href = 'styles.css';
          head.appendChild(stylesLink);
        }
        if (styleLink) styleLink.remove();
      }
    }

    function back() {
      if (isnotsearched) {
        const resultDiv = document.querySelector('.list-of-result');
        resultDiv.classList.remove('show');
        location.reload();
        switchStylesheet(false); // Use styles.css when hidden
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

    // Store the blob for the send email function
    itemToFetch.blob = blob;
    itemToFetch.filename = filename;

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

function sendEmailClickHandler(item) {
  if (!item.blob) {
    alert("لطفا ایتدا اطلاعات را دریافت کنید.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const emails = [];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    // Iterate over rows, starting from the second row (index 1)
    for (let R = 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({r: R, c: 0}); // Column A
        const cell = worksheet[cellAddress];
        if (cell && cell.v && String(cell.v).trim() !== '') {
            emails.push(cell.v);
        }
    }

    if (emails.length === 0) {
      alert("No emails found in the file.");
    } else if (emails.length === 1) {
      openGmail(emails[0]);
    } else {
      showEmailPopup(emails);
    }
  };
  reader.onerror = function(e) {
      alert("Failed to read the file.");
      console.error("FileReader error:", e);
  }
  reader.readAsArrayBuffer(item.blob);
}

function openGmail(email) {
    window.location.href = `mailto:${email}`;
}

function showEmailPopup(emails) {
    const existingPopup = document.getElementById('email-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'email-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.border = '1px solid #ccc';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    popup.style.zIndex = '1000';
    popup.style.textAlign = 'center';
    popup.style.width = '90%';
    popup.style.maxWidth = '400px';

    const title = document.createElement('h3');
    title.textContent = 'Choose an email to send:';
    popup.appendChild(title);

    const emailList = document.createElement('ul');
    emailList.style.listStyle = 'none';
    emailList.style.padding = '0';

    emails.forEach(email => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = email;
        button.onclick = () => {
            openGmail(email);
            popup.remove();
        };
        button.style.margin = '5px';
        button.style.width = '100%';
        li.appendChild(button);
        emailList.appendChild(li);
    });

    popup.appendChild(emailList);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => popup.remove();
    closeBtn.style.marginTop = '10px';
    closeBtn.style.backgroundColor = '#f44336';
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);
}

    function showCategory(jsonData) {
      isnotsearched = true;
      if (jsonData) cachedJsonData = jsonData;
      else jsonData = cachedJsonData;

      const resultDiv = document.querySelector('.list-of-result');
      resultDiv.innerHTML = '';
      document.querySelector('.search-form').style.display = 'none';
      resultDiv.style.display = 'block';
      switchStylesheet(true); // Use style.css when shown
      setTimeout(() => resultDiv.classList.add('show'), 10);

      const header = document.createElement('div');
      header.className = 'list-header';

      const backButton = document.createElement('button');
      backButton.className = 'back';
      backButton.innerHTML = '<i class="fas fa-arrow-left"></i> بازگشت';
      backButton.onclick = back;
      header.appendChild(backButton);

      const printButton = document.createElement('button');
      printButton.className = 'print-btn';
      printButton.innerHTML = '<i class="fas fa-print"></i> Print / Export as PDF';
      printButton.onclick = () => window.print();
      header.appendChild(printButton);

      resultDiv.appendChild(header);

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
      switchStylesheet(true); // Use style.css when shown

      const header = document.createElement('div');
      header.className = 'list-header';

      const backButton = document.createElement('button');
      backButton.className = 'back';
      backButton.innerHTML = '<i class="fas fa-arrow-left"></i> بازگشت';
      backButton.onclick = back;
      header.appendChild(backButton);

      const printButton = document.createElement('button');
      printButton.className = 'print-btn';
      printButton.innerHTML = '<i class="fas fa-print"></i> Print / Export as PDF';
      printButton.onclick = () => window.print();
      header.appendChild(printButton);
      
      resultDiv.appendChild(header);

      const searchUl = document.createElement('ul');
      searchUl.style.listStyleType = 'none';
      searchUl.style.paddingRight = '0';
      searchUl.style.direction = 'rtl';

      const blockedWebsites = ['amazon', 'ebay', 'craigslist', 'instagram', 'facebook','wikipedia'];

      data.forEach(item => {
        isnotsearched = false
        if (blockedWebsites.some(site => item.link.includes(site))) return;

        const li = document.createElement('li');
        li.style.marginBottom = '10px';
        li.innerHTML = `<div class="item-content">
                          <h4><a href="${item.link}" target="_blank">${item.title}</a></h4>
                          <p>${item.snippet}</p>
                        </div>`;
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        
        const emailBtn = document.createElement('button');
        emailBtn.className = 'email';
        emailBtn.innerHTML = '<i class="fas fa-info-circle"></i> Extract All Info';
        emailBtn.onclick = (e) => email(item, e.target);
        buttonGroup.appendChild(emailBtn);

        const sendemail = document.createElement('button');
        sendemail.className = 'send-email';
        sendemail.innerHTML = '<i class="fas fa-paper-plane"></i> Send Email';
        sendemail.onclick = () => sendEmailClickHandler(item);
        buttonGroup.appendChild(sendemail);

        li.appendChild(buttonGroup);
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

    document.querySelector('.login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      checkLogin();
    });
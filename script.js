document.addEventListener('DOMContentLoaded', () => {
    const activityTableBody = document.querySelector('.activity-selection-section table tbody');
    const activitySubmissionForm = document.getElementById('activity-submission-form');
    const formStatus = document.getElementById('form-status');
    const selectionSummary = document.getElementById('selection-summary');
    const summaryText = document.getElementById('summary-text');

    const employeeSelections = {};

    // =========================================================================
    // الروابط والمعرفات وقيم الإرسال المحدثة بناءً على تحليل النموذج الجديد
    // =========================================================================
    const GOOGLE_FORM_URL_BASE = 'https://docs.google.com/forms/d/e/1FAIpQLScVvgra4RDsaLd6sv0o19HQHMqxZfepYjmcXZbWbzdd4wMzGw/formResponse';
    
    const GOOGLE_FORM_ENTRY_IDS = {
        employeeName: 'entry.1211704904', // اسم الموظف - ID من النموذج الجديد
        departmentName: 'entry.869066259', // اسم الجهة - ID من النموذج الجديد
        
        // الأنشطة ومربع "المشاركة بزيارة" - كلها ترسل قيمة 'Option 1' الآن
        'المشاركة بزيارة': 'entry.1169193560',
        'النشاط 1': 'entry.7282178',
        'النشاط 2': 'entry.1028961339',
        'النشاط 3': 'entry.1855751472',
        'النشاط 4': 'entry.761410515',
        'النشاط 5': 'entry.2042745021',
        'النشاط 6': 'entry.346795386',
        'النشاط 7': 'entry.419807472',
        'النشاط 8': 'entry.833895085',
        'النشاط 9': 'entry.1430276306',
    };
    
    // القيمة الصحيحة التي يجب إرسالها لجميع مربعات الاختيار في النموذج الجديد هي 'Option 1'
    const VALUE_TO_SUBMIT_FOR_CHECKBOXES = 'Option 1'; 

    // **الحقول المخفية الضرورية من Google Forms (القيم المحدثة من النموذج الجديد)**
    const HIDDEN_FORM_FIELDS = {
        'fvv': '1',
        'partialResponse': '[null,null,"-286504399359964835"]', // قيمة جديدة من النموذج الجديد
        'pageHistory': '0',
        'fbzx': '-286504399359964835', // قيمة جديدة من النموذج الجديد
        // 'dlut' لم يظهر كحقل مخفي منفصل في اللقطات الجديدة، نأمل أن يتم التعامل معه تلقائيًا أو أنه غير مطلوب الآن
    };
    // =========================================================================

    activityTableBody.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const checkbox = event.target;
            const row = checkbox.closest('tr');
            const employeeName = row.dataset.employeeName;
            const activityName = checkbox.dataset.activityName; 
            
            if (!employeeSelections[employeeName]) {
                const departmentName = row.children[1].textContent;
                employeeSelections[employeeName] = {
                    department: departmentName,
                    activities: []
                };
            }

            if (checkbox.checked) {
                if (!employeeSelections[employeeName].activities.includes(activityName)) {
                    employeeSelections[employeeName].activities.push(activityName);
                }
            } else {
                employeeSelections[employeeName].activities = employeeSelections[employeeName].activities.filter(item => item !== activityName);
                if (employeeSelections[employeeName].activities.length === 0) {
                    delete employeeSelections[employeeName];
                }
            }
            updateSummaryDisplay();
        }
    });

    function updateSummaryDisplay() {
        let summaryParts = [];
        for (const empName in employeeSelections) {
            const data = employeeSelections[empName];
            if (data.activities.length > 0) {
                summaryParts.push(`${empName} (${data.department}): (${data.activities.join('، ')})`);
            }
        }

        if (summaryParts.length > 0) {
            summaryText.textContent = summaryParts.join(' | ');
            selectionSummary.classList.remove('hidden');
        } else {
            selectionSummary.classList.add('hidden');
        }
    }

    activitySubmissionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        let hasSelections = false;
        for (const empName in employeeSelections) {
            if (employeeSelections[empName].activities.length > 0) {
                hasSelections = true;
                break;
            }
        }

        if (!hasSelections) {
            formStatus.textContent = 'الرجاء تحديد نشاط واحد على الأقل لأحد المشاركين قبل الإرسال.';
            formStatus.className = 'error';
            formStatus.classList.remove('hidden');
            return;
        }

        formStatus.textContent = 'جاري الإرسال...';
        formStatus.className = '';
        formStatus.classList.remove('hidden');

        for (const empName in employeeSelections) {
            const empData = employeeSelections[empName];
            
            if (empData.activities.length === 0) {
                continue;
            }

            const formData = new FormData();
            
            // إضافة حقول اسم الموظف والجهة
            if (GOOGLE_FORM_ENTRY_IDS.employeeName) {
                formData.append(GOOGLE_FORM_ENTRY_IDS.employeeName, empName);
            }
            if (GOOGLE_FORM_ENTRY_IDS.departmentName) {
                formData.append(GOOGLE_FORM_ENTRY_IDS.departmentName, empData.department);
            }

            // إضافة حقول الأنشطة المحددة (بما في ذلك المشاركة بزيارة)
            empData.activities.forEach(activityName => {
                const entryId = GOOGLE_FORM_ENTRY_IDS[activityName];
                if (entryId) {
                    // نرسل 'Option 1' الآن لأن هذا ما يظهره النموذج الجديد
                    formData.append(entryId, VALUE_TO_SUBMIT_FOR_CHECKBOXES); 
                    // إضافة حقل sentinel لكل نشاط محدد (للدلالة على أنه تم اختياره)
                    // الـ sentinel IDs يتم توليدها تلقائياً بواسطة Google Forms 
                    // إذا لم تكن موجودة كحقول مخفية، فلا نحتاج لإضافتها يدوياً.
                }
            });

            // إضافة الحقول المخفية
            for (const key in HIDDEN_FORM_FIELDS) {
                if (HIDDEN_FORM_FIELDS.hasOwnProperty(key)) {
                    formData.append(key, HIDDEN_FORM_FIELDS[key]);
                }
            }
            
            // إضافة submissionTimestamp الذي يتغير في كل مرة
            // هذا يعتمد على توقيت الإرسال، وهو ضروري
            formData.append('submissionTimestamp', Date.now()); 
            

            try {
                const response = await fetch(GOOGLE_FORM_URL_BASE, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors',
                });
            } catch (error) {
                console.error(`Error sending data for ${empName}:`, error);
                formStatus.textContent = 'حدث خطأ أثناء إرسال بعض البيانات. الرجاء المحاولة مرة أخرى.';
                formStatus.className = 'error';
                return;
            }
        }

        formStatus.textContent = 'تم إرسال جميع الاختيارات بنجاح إلى جداول البيانات! شكراً لكم.';
        formStatus.className = 'success';
        resetFormAndUI();
    });

    function resetFormAndUI() {
        for (const key in employeeSelections) {
            delete employeeSelections[key];
        }
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        updateSummaryDisplay();
    }

    updateSummaryDisplay();
});

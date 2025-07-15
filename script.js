document.addEventListener('DOMContentLoaded', () => {
    const activityTableBody = document.querySelector('.activity-selection-section table tbody');
    const activitySubmissionForm = document.getElementById('activity-submission-form');
    const formStatus = document.getElementById('form-status');
    const selectionSummary = document.getElementById('selection-summary');
    const summaryText = document.getElementById('summary-text');

    const employeeSelections = {};

    // =========================================================================
    // الروابط والمعرفات وقيم الإرسال المحدثة بناءً على جميع التحليلات
    // =========================================================================
    const GOOGLE_FORM_URL_BASE = 'https://docs.google.com/forms/d/e/1FAIpQLSfskftL8UgG1bfz8ajrjQs8poxAf3g-JdIpkx1-fuzUno65dw/formResponse';
    
    const GOOGLE_FORM_ENTRY_IDS = {
        employeeName: 'entry.1739513905', // اسم الموظف
        departmentName: 'entry.1939048277', // اسم الجهة
        
        // الأنشطة ومربع "المشاركة بزيارة" - كلها ترسل قيمة 'مشارك'
        'المشاركة بزيارة': 'entry.141139549',
        'النشاط 1': 'entry.1701544817',
        'النشاط 2': 'entry.1049433567',
        'النشاط 3': 'entry.1415917879',
        'النشاط 4': 'entry.1226158303',
        'النشاط 5': 'entry.1245581123',
        'النشاط 6': 'entry.1679509619',
        'النشاط 7': 'entry.871969035',
        'النشاط 8': 'entry.814976203',
        'النشاط 9': 'entry.1515678535',
    };
    
    const VALUE_TO_SUBMIT_FOR_CHECKBOXES = 'مشارك'; // القيمة الصحيحة التي يجب إرسالها لجميع مربعات الاختيار

    // **الحقول المخفية الضرورية من Google Forms (قم بتحديث القيم إذا تغيرت في نموذجك)**
    const HIDDEN_FORM_FIELDS = {
        'dlut': '1752577619609', // مثال: تأكد من تحديث هذه القيمة إذا تغيرت في النموذج
        'fbzx': '-7979597982292452690', // مثال: تأكد من تحديث هذه القيمة إذا تغيرت في النموذج
        'fvv': '1', // هذه القيمة ثابتة غالباً
        'partialResponse': '[null,null,"-7979597982292452690"]', // تأكد من تحديث هذه القيمة إذا تغيرت
        'pageHistory': '0', // هذه القيمة ثابتة غالباً
        // 'submissionTimestamp' لا يجب إضافته هنا، يتم إنشاؤه تلقائياً
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
                    formData.append(entryId, VALUE_TO_SUBMIT_FOR_CHECKBOXES); // دائماً ترسل 'مشارك'
                    // إضافة حقل sentinel لكل نشاط محدد (للدلالة على أنه تم اختياره)
                    formData.append(`${entryId}_sentinel`, ''); // قيمة فارغة
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
            // تأكد من أن Google Forms يستخدم توقيت Unix timestamp (بالمللي ثانية)

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

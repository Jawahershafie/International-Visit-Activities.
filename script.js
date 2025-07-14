document.addEventListener('DOMContentLoaded', () => {
    const activityTableBody = document.querySelector('.activity-selection-section table tbody');
    const activitySubmissionForm = document.getElementById('activity-submission-form');
    const formStatus = document.getElementById('form-status');
    const selectionSummary = document.getElementById('selection-summary');
    const summaryText = document.getElementById('summary-text');

    // لتخزين الأنشطة المختارة لكل موظف
    const employeeSelections = {};

    // ==========================================================
    // هذه الروابط والمعرفات الخاصة بنموذج جوجل الخاص بك        
    // تم تحديثها بناءً على الـ IDs الجديدة والمؤكدة من الرابط   
    // ==========================================================
    const GOOGLE_FORM_URL_BASE = 'https://docs.google.com/forms/d/e/1FAIpQLSfskftL8UgG1bfz8ajrjQs8poxAf3g-JdIpkx1-fuzUno65dw/formResponse';
    
    const GOOGLE_FORM_ENTRY_IDS = {
        employeeName: 'entry.1739513905', // اسم الموظف
        departmentName: 'entry.1939048277', // اسم الجهة
        // الأنشطة - هذه هي معرفات مربعات الاختيار في نموذج جوجل
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
    
    const CHECKBOX_VALUE = 'Option 1'; 
    // ==========================================================

    // معالجة النقر على مربعات الاختيار
    activityTableBody.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const checkbox = event.target;
            const row = checkbox.closest('tr');
            const employeeName = row.dataset.employeeName;
            const activityName = checkbox.dataset.activityName;
            
            // إذا لم يكن الموظف موجوداً، أضف كائن له
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
            console.log(employeeSelections);
        }
    });

    // تحديث ملخص الأنشطة في أسفل الصفحة
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

    // التعامل مع إرسال النموذج إلى Google Forms
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
            
            const formData = new FormData();
            
            // إضافة اسم الموظف واسم الجهة إلى بيانات النموذج
            if (GOOGLE_FORM_ENTRY_IDS.employeeName) {
                formData.append(GOOGLE_FORM_ENTRY_IDS.employeeName, empName);
            }
            if (GOOGLE_FORM_ENTRY_IDS.departmentName) {
                formData.append(GOOGLE_FORM_ENTRY_IDS.departmentName, empData.department);
            }

            // ===================================================================
            // التعديل هنا: فقط أضف الأنشطة المحددة، لا ترسل قيمة فارغة لغير المحدد
            // ===================================================================
            empData.activities.forEach(activityName => {
                const entryId = GOOGLE_FORM_ENTRY_IDS[activityName];
                if (entryId) {
                    formData.append(entryId, CHECKBOX_VALUE);
                }
            });
            // ===================================================================

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

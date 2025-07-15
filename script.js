document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('table tbody');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selectionSummary = document.getElementById('selection-summary');
    const summaryText = document.getElementById('summary-text');
    const submissionForm = document.getElementById('activity-submission-form');
    const formStatus = document.getElementById('form-status');

    let employeeSelections = {};

    // =========================================================================
    // ** تم تحديث هذه القيم بناءً على الصور التي أرفقتها **
    // =========================================================================

    // رابط إرسال النموذج (تم تعديل 'viewform' إلى 'formResponse')
    // من صورة 'سس.png' أو '5666.png'
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfskftL8UgG1bfz8ajrjQs8poxAf3g-JdIpkx1-fuzUno65dw/formResponse'; 

    const GOOGLE_FORM_ENTRY_IDS = {
        'اسم المشارك': '1650924768',          // ID لحقل "اسم الموظف"
        'اسم الجهة': '939811127',             // ID لحقل "اسم الجهة"
        
        // هذا هو الـ ID الخاص بحقل "الأنشطة المشارك بها" (الموجود في 'بب.png' والذي هو من نوع Short-answer text)
        // هذا الحقل سيستقبل قائمة نصية بجميع الأنشطة المحددة لكل موظف.
        'الأنشطة المختارة': '1049433567' 
    };

    // دالة لتحديث ملخص الاختيارات
    const updateSelectionSummary = () => {
        let summaryHtml = '';
        let hasSelections = false;

        for (const employeeName in employeeSelections) {
            const employeeData = employeeSelections[employeeName];
            if (employeeData.activities.length > 0) {
                hasSelections = true;
                summaryHtml += `
                    <div style="margin-bottom: 10px; padding: 8px; border-bottom: 1px dashed var(--green-light);">
                        <strong>${employeeName} (${employeeData.department}):</strong>
                        ${employeeData.activities.join('، ')}
                    </div>
                `;
            }
        }

        if (hasSelections) {
            summaryText.innerHTML = summaryHtml;
            selectionSummary.classList.remove('hidden');
        } else {
            selectionSummary.classList.add('hidden');
        }
    };

    // معالجة تغيير حالة مربع الاختيار
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const employeeRow = event.target.closest('tr');
            const employeeName = employeeRow.dataset.employeeName;
            const department = employeeRow.querySelector('td:nth-child(2)').textContent.trim();
            const activityName = event.target.dataset.activityName;
            const isChecked = event.target.checked;

            if (!employeeSelections[employeeName]) {
                employeeSelections[employeeName] = { activities: [], department: department };
            }

            if (isChecked) {
                if (!employeeSelections[employeeName].activities.includes(activityName)) {
                    employeeSelections[employeeName].activities.push(activityName);
                }
            } else {
                employeeSelections[employeeName].activities = employeeSelections[employeeName].activities.filter(activity => activity !== activityName);
            }
            updateSelectionSummary();
        });
    });

    // معالجة إرسال النموذج
    submissionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        formStatus.classList.remove('success', 'error');
        formStatus.classList.add('hidden');
        formStatus.textContent = '';

        if (Object.keys(employeeSelections).length === 0 || !Object.values(employeeSelections).some(data => data.activities.length > 0)) {
            formStatus.textContent = 'الرجاء اختيار نشاط واحد على الأقل قبل الإرسال.';
            formStatus.classList.remove('hidden');
            formStatus.classList.add('error');
            return;
        }

        const formData = new FormData();

        for (const employeeName in employeeSelections) {
            const employeeData = employeeSelections[employeeName];
            if (employeeData.activities.length > 0) {
                // إرسال اسم المشارك والجهة
                if (GOOGLE_FORM_ENTRY_IDS['اسم المشارك']) {
                    formData.append(`entry.${GOOGLE_FORM_ENTRY_IDS['اسم المشارك']}`, employeeName);
                }
                if (GOOGLE_FORM_ENTRY_IDS['اسم الجهة']) {
                    formData.append(`entry.${GOOGLE_FORM_ENTRY_IDS['اسم الجهة']}`, employeeData.department);
                }
                
                // إرسال جميع الأنشطة المختارة كقائمة نصية في حقل واحد
                if (GOOGLE_FORM_ENTRY_IDS['الأنشطة المختارة']) {
                    const combinedActivities = employeeData.activities.join(', ');
                    formData.append(`entry.${GOOGLE_FORM_ENTRY_IDS['الأنشطة المختارة']}`, combinedActivities);
                }
            }
        }

        try {
            formStatus.textContent = 'جاري الإرسال...';
            formStatus.classList.remove('hidden', 'error');

            const response = await fetch(GOOGLE_FORM_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' 
            });

            formStatus.textContent = 'تم إرسال الاختيارات بنجاح! شكراً لك.';
            formStatus.classList.remove('hidden', 'error');
            formStatus.classList.add('success');

        } catch (error) {
            console.error('Error submitting form:', error);
            formStatus.textContent = 'حدث خطأ أثناء الإرسال. الرجاء المحاولة مرة أخرى.';
            formStatus.classList.remove('hidden', 'success');
            formStatus.classList.add('error');
        }
    });

    updateSelectionSummary();
});

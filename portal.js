const TOKEN_KEY = 'psa_portal_token';
const PORTAL_THEME_KEY = 'psa_portal_theme';
const PORTAL_LANGUAGE_KEY = 'psa_portal_language';
const IS_FILE_PROTOCOL = window.location.protocol === 'file:';
const API_BASE_URL = IS_FILE_PROTOCOL ? 'http://localhost:3000' : '';

const PORTAL_DEFAULT_LANGUAGE = 'en';
const PORTAL_RTL_LANGUAGES = new Set(['ar']);
const PORTAL_LANGUAGE_LABELS = {
  en: 'English',
  es: 'Español',
  ar: 'العربية',
};

const PORTAL_TRANSLATIONS = {
  en: {
    header: {
      language: 'Language',
      logout: 'Log Out',
      switchToDarkMode: 'Switch to Dark Mode',
      switchToLightMode: 'Switch to Light Mode',
      employeeDashboard: 'Employee Dashboard',
      clientDashboard: 'Client Dashboard',
      employeeSubtitle: "Welcome back. Here's your profile and onboarding status.",
      clientSubtitle: 'Manage your job postings and company profile.',
      welcomeEmployee: 'Welcome {name}',
      welcomeClient: 'Welcome {name}',
    },
    common: {
      loading: 'Loading...',
      loadingConversation: 'Loading conversation...',
      notSet: 'Not set',
      edit: 'Edit',
      cancel: 'Cancel',
      saveProfile: 'Save Profile',
      saveChanges: 'Save Changes',
      saveAccountSettings: 'Save Account Settings',
      clearRead: 'Clear Read',
      enablePushNotifications: 'Enable Push Notifications',
      notificationChannels: 'Notification Channels',
      emailNotifications: 'Email Notifications',
      textNotifications: 'Text Notifications',
      appPushNotifications: 'App Push Notifications',
      recipient: 'Recipient',
      message: 'Message',
      selectRecipient: 'Select recipient',
      typeYourMessage: 'Type your message',
      sendMessage: 'Send Message',
      phone: 'Phone',
      streetAddress: 'Street Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      when: 'When',
      type: 'Type',
      activity: 'Activity',
      status: 'Status',
      action: 'Action',
      close: 'Close',
    },
    account: {
      title: 'Account Settings',
      accountTitle: 'Account',
      fullName: 'Full Name',
      userId: 'User ID',
      currentEmail: 'Current Email',
      changeEmail: 'Change Email',
      changeEmailPlaceholder: 'new-email@example.com',
      pendingEmailNotice: 'Verification sent to {email}. Confirm the new address before it becomes active.',
      currentPassword: 'Current Password',
      currentCredential: 'Current Password or Passcode',
      currentCredentialPlaceholder: 'Password or 4-digit passcode',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'At least 8 characters',
      newPasscode: 'New 4-Digit Passcode',
      newPasscodePlaceholder: '1234',
      removeStoredPasscode: 'Remove stored passcode',
      mailingAddress: 'Mailing Address',
      skills: 'Skills',
      certifications: 'Certifications',
      companyName: 'Company Name',
      contactName: 'Contact Name',
      noChanges: 'No account settings were changed.',
      currentCredentialRequired: 'Current password or 4-digit passcode is required.',
      fullNameRequired: 'Full name must be at least 2 characters.',
      passwordMin: 'New password must be at least 8 characters.',
      passcodeInvalid: 'Passcode must be exactly 4 digits.',
      phoneInvalid: 'Phone number must be exactly 10 digits.',
      addressRequired: 'Enter street address, city, state, and ZIP code.',
      stateInvalid: 'State must be a 2-letter code (for example, NV).',
      zipInvalid: 'ZIP code must be 5 digits or ZIP+4 format.',
      companyNameRequired: 'Company name is required and cannot be empty.',
      contactNameRequired: 'Primary contact name is required and cannot be empty.',
      saved: 'Account settings saved.',
      savedPasscode: 'Account settings saved. Passcode is active.',
      savedPendingEmail: 'Account settings saved. Check {email} to verify your new email address.',
      emailLabel: 'Email',
    },
    notifications: {
      title: 'Notifications',
      employeeDescription: 'Enable browser notifications to receive alerts when your uploaded documents are approved or denied by an administrator.',
      employeeActiveDescription: 'Enable browser notifications to receive live alerts when your documents are reviewed, messages arrive, and shift updates are available.',
      clientDescription: 'Enable browser notifications to receive alerts when contracts, messages, and timesheet updates need your attention.',
      unavailable: 'Push notifications are not available in this browser.',
      blocked: 'Browser notifications are blocked for this site.',
      enabled: 'Push notifications are enabled for this device.',
      enabledButton: 'Push Notifications Enabled',
      employeeEnabled: 'Status: Active. Push notifications are enabled for this device and shift alerts are active.',
      pendingApproval: 'Pending Admin Approval',
      permissionDenied: 'Notification permission was not granted.',
      subscriptionFailed: 'Failed to save push notification subscription.',
      deviceEnabled: 'Push notifications enabled for this device.',
    },
    messaging: {
      title: 'Messages',
      invalidRecipient: 'Select a valid recipient.',
      messageRequired: 'Message body is required.',
      sending: 'Sending...',
      sent: 'Message sent successfully.',
      deleted: 'Message deleted from your conversation view.',
      deleteFailed: 'Unable to delete this message.',
    },
    employee: {
      registeredRoles: 'Registered Roles',
      documents: 'Documents',
      profileComplete: 'Profile Complete',
      acceptedShifts: 'Accepted Shifts',
      myProfile: 'My Profile',
      position: 'Position',
      backgroundCheck: 'Background Check',
      address: 'Address',
      ssn: 'SSN',
      ssnOnFile: 'On File (Encrypted)',
      ssnMissing: 'Not Submitted',
      currentShifts: 'Current Shifts',
      pastShifts: 'Past Shifts',
      openShifts: 'Open Shifts',
      noCurrentAssignments: 'No current assignments.',
      noPastAssignments: 'No past assignments.',
      noApplications: 'No applications submitted yet.',
      noDocuments: 'No documents uploaded yet.',
      waitingBackground: 'Waiting for admin-uploaded background',
    },
    jobsite: {
      totalShifts: 'Total Shifts',
      openShifts: 'Open Shifts',
      closedShifts: 'Closed Shifts',
      companyProfile: 'Company Profile',
      company: 'Company',
      contact: 'Contact',
      industryTrack: 'Industry Track',
      yourShifts: 'Your Shifts',
      postNewShift: 'Post a New Shift',
      assignedWorkers: 'Assigned Workers',
      noJobs: 'No jobs posted yet. Use the form on the right to create your first job.',
      noAssignedWorkers: 'No workers currently assigned to your shifts.',
    },
  },
  es: {
    header: {
      language: 'Idioma',
      logout: 'Cerrar sesión',
      switchToDarkMode: 'Cambiar a modo oscuro',
      switchToLightMode: 'Cambiar a modo claro',
      employeeDashboard: 'Panel del empleado',
      clientDashboard: 'Panel del cliente',
      employeeSubtitle: 'Bienvenido de nuevo. Aquí están tu perfil y tu estado de incorporación.',
      clientSubtitle: 'Administra tus turnos publicados y el perfil de tu empresa.',
      welcomeEmployee: 'Bienvenido {name}',
      welcomeClient: 'Bienvenido {name}',
    },
    common: {
      loading: 'Cargando...',
      loadingConversation: 'Cargando conversación...',
      notSet: 'Sin definir',
      edit: 'Editar',
      cancel: 'Cancelar',
      saveProfile: 'Guardar perfil',
      saveChanges: 'Guardar cambios',
      saveAccountSettings: 'Guardar configuración de la cuenta',
      clearRead: 'Borrar leídas',
      enablePushNotifications: 'Activar notificaciones push',
      notificationChannels: 'Canales de notificación',
      emailNotifications: 'Notificaciones por correo',
      textNotifications: 'Notificaciones por texto',
      appPushNotifications: 'Notificaciones push de la app',
      recipient: 'Destinatario',
      message: 'Mensaje',
      selectRecipient: 'Selecciona un destinatario',
      typeYourMessage: 'Escribe tu mensaje',
      sendMessage: 'Enviar mensaje',
      phone: 'Teléfono',
      streetAddress: 'Dirección',
      city: 'Ciudad',
      state: 'Estado',
      zipCode: 'Código postal',
      when: 'Cuándo',
      type: 'Tipo',
      activity: 'Actividad',
      status: 'Estado',
      action: 'Acción',
      close: 'Cerrar',
    },
    account: {
      title: 'Configuración de la cuenta',
      accountTitle: 'Cuenta',
      fullName: 'Nombre completo',
      userId: 'ID de usuario',
      currentEmail: 'Correo actual',
      changeEmail: 'Cambiar correo',
      changeEmailPlaceholder: 'nuevo-correo@ejemplo.com',
      pendingEmailNotice: 'Se envió una verificación a {email}. Confirma la nueva dirección antes de activarla.',
      currentPassword: 'Contraseña actual',
      currentCredential: 'Contraseña actual o código',
      currentCredentialPlaceholder: 'Contraseña o código de 4 dígitos',
      newPassword: 'Nueva contraseña',
      newPasswordPlaceholder: 'Al menos 8 caracteres',
      newPasscode: 'Nuevo código de 4 dígitos',
      newPasscodePlaceholder: '1234',
      removeStoredPasscode: 'Eliminar código guardado',
      mailingAddress: 'Dirección postal',
      skills: 'Habilidades',
      certifications: 'Certificaciones',
      companyName: 'Nombre de la empresa',
      contactName: 'Nombre del contacto',
      noChanges: 'No se cambió ninguna configuración de la cuenta.',
      currentCredentialRequired: 'Se requiere la contraseña actual o un código de 4 dígitos.',
      fullNameRequired: 'El nombre completo debe tener al menos 2 caracteres.',
      passwordMin: 'La nueva contraseña debe tener al menos 8 caracteres.',
      passcodeInvalid: 'El código debe tener exactamente 4 dígitos.',
      phoneInvalid: 'El número de teléfono debe tener exactamente 10 dígitos.',
      addressRequired: 'Ingresa la dirección, ciudad, estado y código postal.',
      stateInvalid: 'El estado debe tener 2 letras (por ejemplo, NV).',
      zipInvalid: 'El código postal debe tener 5 dígitos o formato ZIP+4.',
      companyNameRequired: 'El nombre de la empresa es obligatorio y no puede estar vacío.',
      contactNameRequired: 'El nombre del contacto principal es obligatorio y no puede estar vacío.',
      saved: 'La configuración de la cuenta se guardó.',
      savedPasscode: 'La configuración de la cuenta se guardó. El código está activo.',
      savedPendingEmail: 'La configuración se guardó. Revisa {email} para verificar tu nuevo correo.',
      emailLabel: 'Correo electrónico',
    },
    notifications: {
      title: 'Notificaciones',
      employeeDescription: 'Activa las notificaciones del navegador para recibir alertas cuando un administrador apruebe o rechace tus documentos.',
      employeeActiveDescription: 'Activa las notificaciones del navegador para recibir alertas cuando revisen tus documentos, lleguen mensajes y haya actualizaciones de turnos.',
      clientDescription: 'Activa las notificaciones del navegador para recibir alertas cuando contratos, mensajes y actualizaciones de horas requieran tu atención.',
      unavailable: 'Las notificaciones push no están disponibles en este navegador.',
      blocked: 'Las notificaciones del navegador están bloqueadas para este sitio.',
      enabled: 'Las notificaciones push están activadas para este dispositivo.',
      enabledButton: 'Notificaciones push activadas',
      employeeEnabled: 'Estado: Activo. Las notificaciones push están activadas para este dispositivo y las alertas de turnos están activas.',
      pendingApproval: 'Pendiente de aprobación del administrador',
      permissionDenied: 'No se concedió el permiso de notificaciones.',
      subscriptionFailed: 'No se pudo guardar la suscripción de notificaciones push.',
      deviceEnabled: 'Notificaciones push activadas para este dispositivo.',
    },
    messaging: {
      title: 'Mensajes',
      invalidRecipient: 'Selecciona un destinatario válido.',
      messageRequired: 'El mensaje es obligatorio.',
      sending: 'Enviando...',
      sent: 'Mensaje enviado correctamente.',
      deleted: 'El mensaje se eliminó de tu vista de conversación.',
      deleteFailed: 'No se pudo eliminar este mensaje.',
    },
    employee: {
      registeredRoles: 'Puestos registrados',
      documents: 'Documentos',
      profileComplete: 'Perfil completo',
      acceptedShifts: 'Turnos aceptados',
      myProfile: 'Mi perfil',
      position: 'Puesto',
      backgroundCheck: 'Verificación de antecedentes',
      address: 'Dirección',
      ssn: 'SSN',
      ssnOnFile: 'En archivo (cifrado)',
      ssnMissing: 'No enviado',
      currentShifts: 'Turnos actuales',
      pastShifts: 'Turnos anteriores',
      openShifts: 'Turnos disponibles',
      noCurrentAssignments: 'No hay turnos actuales.',
      noPastAssignments: 'No hay turnos anteriores.',
      noApplications: 'Aún no hay solicitudes enviadas.',
      noDocuments: 'Aún no hay documentos cargados.',
      waitingBackground: 'Esperando verificación de antecedentes cargada por administración',
    },
    jobsite: {
      totalShifts: 'Turnos totales',
      openShifts: 'Turnos abiertos',
      closedShifts: 'Turnos cerrados',
      companyProfile: 'Perfil de la empresa',
      company: 'Empresa',
      contact: 'Contacto',
      industryTrack: 'Área',
      yourShifts: 'Tus turnos',
      postNewShift: 'Publicar un nuevo turno',
      assignedWorkers: 'Trabajadores asignados',
      noJobs: 'Aún no hay turnos publicados. Usa el formulario de la derecha para crear el primero.',
      noAssignedWorkers: 'No hay trabajadores asignados a tus turnos.',
    },
  },
  ar: {
    header: {
      language: 'اللغة',
      logout: 'تسجيل الخروج',
      switchToDarkMode: 'التبديل إلى الوضع الداكن',
      switchToLightMode: 'التبديل إلى الوضع الفاتح',
      employeeDashboard: 'لوحة الموظف',
      clientDashboard: 'لوحة العميل',
      employeeSubtitle: 'مرحباً بعودتك. هنا ملفك الشخصي وحالة الإعداد.',
      clientSubtitle: 'أدر الوظائف المنشورة وملف شركتك.',
      welcomeEmployee: 'مرحباً {name}',
      welcomeClient: 'مرحباً {name}',
    },
    common: {
      loading: 'جارٍ التحميل...',
      loadingConversation: 'جارٍ تحميل المحادثة...',
      notSet: 'غير محدد',
      edit: 'تعديل',
      cancel: 'إلغاء',
      saveProfile: 'حفظ الملف الشخصي',
      saveChanges: 'حفظ التغييرات',
      saveAccountSettings: 'حفظ إعدادات الحساب',
      clearRead: 'مسح المقروء',
      enablePushNotifications: 'تفعيل الإشعارات الفورية',
      notificationChannels: 'قنوات الإشعارات',
      emailNotifications: 'إشعارات البريد الإلكتروني',
      textNotifications: 'إشعارات الرسائل النصية',
      appPushNotifications: 'إشعارات التطبيق',
      recipient: 'المستلم',
      message: 'الرسالة',
      selectRecipient: 'اختر المستلم',
      typeYourMessage: 'اكتب رسالتك',
      sendMessage: 'إرسال الرسالة',
      phone: 'الهاتف',
      streetAddress: 'عنوان الشارع',
      city: 'المدينة',
      state: 'الولاية',
      zipCode: 'الرمز البريدي',
      when: 'الوقت',
      type: 'النوع',
      activity: 'النشاط',
      status: 'الحالة',
      action: 'الإجراء',
      close: 'إغلاق',
    },
    account: {
      title: 'إعدادات الحساب',
      accountTitle: 'الحساب',
      fullName: 'الاسم الكامل',
      userId: 'معرّف المستخدم',
      currentEmail: 'البريد الإلكتروني الحالي',
      changeEmail: 'تغيير البريد الإلكتروني',
      changeEmailPlaceholder: 'new-email@example.com',
      pendingEmailNotice: 'تم إرسال التحقق إلى {email}. أكّد العنوان الجديد قبل تفعيله.',
      currentPassword: 'كلمة المرور الحالية',
      currentCredential: 'كلمة المرور الحالية أو رمز المرور',
      currentCredentialPlaceholder: 'كلمة المرور أو رمز مرور من 4 أرقام',
      newPassword: 'كلمة مرور جديدة',
      newPasswordPlaceholder: '8 أحرف على الأقل',
      newPasscode: 'رمز مرور جديد من 4 أرقام',
      newPasscodePlaceholder: '1234',
      removeStoredPasscode: 'إزالة رمز المرور المحفوظ',
      mailingAddress: 'العنوان البريدي',
      skills: 'المهارات',
      certifications: 'الشهادات',
      companyName: 'اسم الشركة',
      contactName: 'اسم جهة الاتصال',
      noChanges: 'لم يتم تغيير أي إعدادات للحساب.',
      currentCredentialRequired: 'مطلوب كلمة المرور الحالية أو رمز مرور من 4 أرقام.',
      fullNameRequired: 'يجب أن يتكون الاسم الكامل من حرفين على الأقل.',
      passwordMin: 'يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل.',
      passcodeInvalid: 'يجب أن يتكون رمز المرور من 4 أرقام فقط.',
      phoneInvalid: 'يجب أن يتكون رقم الهاتف من 10 أرقام.',
      addressRequired: 'أدخل عنوان الشارع والمدينة والولاية والرمز البريدي.',
      stateInvalid: 'يجب أن تكون الولاية مكوّنة من حرفين (مثل NV).',
      zipInvalid: 'يجب أن يكون الرمز البريدي 5 أرقام أو بصيغة ZIP+4.',
      companyNameRequired: 'اسم الشركة مطلوب ولا يمكن أن يكون فارغاً.',
      contactNameRequired: 'اسم جهة الاتصال الرئيسية مطلوب ولا يمكن أن يكون فارغاً.',
      saved: 'تم حفظ إعدادات الحساب.',
      savedPasscode: 'تم حفظ إعدادات الحساب. رمز المرور مفعل.',
      savedPendingEmail: 'تم حفظ الإعدادات. راجع {email} للتحقق من بريدك الإلكتروني الجديد.',
      emailLabel: 'البريد الإلكتروني',
    },
    notifications: {
      title: 'الإشعارات',
      employeeDescription: 'فعّل إشعارات المتصفح لتلقي التنبيهات عندما يوافق المسؤول على مستنداتك أو يرفضها.',
      employeeActiveDescription: 'فعّل إشعارات المتصفح لتلقي التنبيهات عند مراجعة مستنداتك أو وصول الرسائل أو تحديثات الورديات.',
      clientDescription: 'فعّل إشعارات المتصفح لتلقي التنبيهات عندما تحتاج العقود أو الرسائل أو تحديثات الساعات إلى انتباهك.',
      unavailable: 'الإشعارات الفورية غير متاحة في هذا المتصفح.',
      blocked: 'إشعارات المتصفح محظورة لهذا الموقع.',
      enabled: 'تم تفعيل الإشعارات الفورية لهذا الجهاز.',
      enabledButton: 'تم تفعيل الإشعارات',
      employeeEnabled: 'الحالة: مفعّل. تم تفعيل الإشعارات الفورية لهذا الجهاز وتنبيهات الورديات نشطة.',
      pendingApproval: 'بانتظار موافقة المسؤول',
      permissionDenied: 'لم يتم منح إذن الإشعارات.',
      subscriptionFailed: 'تعذر حفظ اشتراك الإشعارات الفورية.',
      deviceEnabled: 'تم تفعيل الإشعارات الفورية لهذا الجهاز.',
    },
    messaging: {
      title: 'الرسائل',
      invalidRecipient: 'اختر مستلماً صالحاً.',
      messageRequired: 'نص الرسالة مطلوب.',
      sending: 'جارٍ الإرسال...',
      sent: 'تم إرسال الرسالة بنجاح.',
      deleted: 'تم حذف الرسالة من عرض المحادثة الخاص بك.',
      deleteFailed: 'تعذر حذف هذه الرسالة.',
    },
    employee: {
      registeredRoles: 'الأدوار المسجلة',
      documents: 'المستندات',
      profileComplete: 'اكتمال الملف',
      acceptedShifts: 'الورديات المقبولة',
      myProfile: 'ملفي الشخصي',
      position: 'المنصب',
      backgroundCheck: 'فحص الخلفية',
      address: 'العنوان',
      ssn: 'رقم الضمان',
      ssnOnFile: 'محفوظ (مشفّر)',
      ssnMissing: 'غير مُرسل',
      currentShifts: 'الورديات الحالية',
      pastShifts: 'الورديات السابقة',
      openShifts: 'الورديات المتاحة',
      noCurrentAssignments: 'لا توجد ورديات حالية.',
      noPastAssignments: 'لا توجد ورديات سابقة.',
      noApplications: 'لا توجد طلبات مقدمة بعد.',
      noDocuments: 'لا توجد مستندات مرفوعة بعد.',
      waitingBackground: 'بانتظار فحص الخلفية المرفوع من الإدارة',
    },
    jobsite: {
      totalShifts: 'إجمالي الورديات',
      openShifts: 'الورديات المفتوحة',
      closedShifts: 'الورديات المغلقة',
      companyProfile: 'ملف الشركة',
      company: 'الشركة',
      contact: 'جهة الاتصال',
      industryTrack: 'المجال',
      yourShifts: 'وردياتك',
      postNewShift: 'نشر وردية جديدة',
      assignedWorkers: 'العمال المعيّنون',
      noJobs: 'لا توجد ورديات منشورة بعد. استخدم النموذج على اليمين لإنشاء أول وردية.',
      noAssignedWorkers: 'لا يوجد عمال معيّنون لوردياتك.',
    },
  },
};

const PORTAL_STATIC_TRANSLATION_BINDINGS = {
  common: [
    { selector: '#portalLanguageLabel', key: 'header.language' },
    { selector: '#portalLogoutBtn', key: 'header.logout' },
    { selector: '#portalNotificationEnableBtn', key: 'common.enablePushNotifications' },
    { selector: '.notify-prefs-block__heading', key: 'common.notificationChannels' },
    { selector: '.notify-toggle-row:nth-of-type(1) .notify-toggle__label', key: 'common.emailNotifications' },
    { selector: '.notify-toggle-row:nth-of-type(2) .notify-toggle__label', key: 'common.textNotifications' },
    { selector: '.notify-toggle-row:nth-of-type(3) .notify-toggle__label', key: 'common.appPushNotifications' },
    { selector: '#portalNotificationsClearReadBtn', key: 'common.clearRead' },
    { selector: 'label[for="portalMessageRecipient"]', key: 'common.recipient' },
    { selector: 'label[for="portalMessageBody"]', key: 'common.message' },
    { selector: '#portalMessageRecipient option[value=""]', key: 'common.selectRecipient' },
    { selector: '#portalMessageBody', key: 'common.typeYourMessage', property: 'placeholder' },
    { selector: '#portalMessageForm button[type="submit"]', key: 'common.sendMessage' },
    { selector: '#portalMessagesList .portal-chat__empty', key: 'common.loadingConversation' },
  ],
  employee: [
    { selector: '.logo__text', key: 'header.employeeDashboard' },
    { selector: '#portalSubtitle', key: 'header.employeeSubtitle' },
    { selector: '#employeeStatRow .stat-card:nth-child(1) .stat-card__label', key: 'employee.registeredRoles' },
    { selector: '#employeeStatRow .stat-card:nth-child(2) .stat-card__label', key: 'employee.documents' },
    { selector: '#employeeStatRow .stat-card:nth-child(3) .stat-card__label', key: 'employee.profileComplete' },
    { selector: '#employeeStatRow .stat-card:nth-child(4) .stat-card__label', key: 'employee.acceptedShifts' },
    { selector: '#employeeProfileEditBtn', key: 'common.edit' },
    { selector: '#employeeProfileEditForm button[type="submit"]', key: 'common.saveProfile' },
    { selector: '#employeeProfileEditCancel', key: 'common.cancel' },
    { selector: '#portalAccountSectionTitle', key: 'account.title' },
    { selector: 'label[for="portalAccountName"]', key: 'account.fullName' },
    { selector: 'label[for="portalAccountUserId"]', key: 'account.userId' },
    { selector: 'label[for="portalAccountEmail"]', key: 'account.currentEmail' },
    { selector: 'label[for="portalNewEmail"]', key: 'account.changeEmail' },
    { selector: '#portalNewEmail', key: 'account.changeEmailPlaceholder', property: 'placeholder' },
    { selector: 'label[for="portalCurrentCredential"]', key: 'account.currentCredential' },
    { selector: '#portalCurrentCredential', key: 'account.currentCredentialPlaceholder', property: 'placeholder' },
    { selector: 'label[for="portalNewPassword"]', key: 'account.newPassword' },
    { selector: '#portalNewPassword', key: 'account.newPasswordPlaceholder', property: 'placeholder' },
    { selector: 'label[for="portalNewPasscode"]', key: 'account.newPasscode' },
    { selector: '#portalNewPasscode', key: 'account.newPasscodePlaceholder', property: 'placeholder' },
    { selector: 'label[for="portalAccountPhone"]', key: 'common.phone' },
    { selector: 'label[for="portalAccountAddress"]', key: 'common.streetAddress' },
    { selector: 'label[for="portalAccountCity"]', key: 'common.city' },
    { selector: 'label[for="portalAccountState"]', key: 'common.state' },
    { selector: 'label[for="portalAccountZip"]', key: 'common.zipCode' },
    { selector: 'label[for="portalAccountSkills"]', key: 'account.skills' },
    { selector: 'label[for="portalAccountCertifications"]', key: 'account.certifications' },
    { selector: 'label[for="portalRemovePasscode"]', key: 'account.removeStoredPasscode' },
    { selector: '#portalAccountForm button[type="submit"]', key: 'common.saveAccountSettings' },
  ],
  jobsite: [
    { selector: '.logo__text', key: 'header.clientDashboard' },
    { selector: '#portalSubtitle', key: 'header.clientSubtitle' },
    { selector: '.stat-row .stat-card:nth-child(1) .stat-card__label', key: 'jobsite.totalShifts' },
    { selector: '.stat-row .stat-card:nth-child(2) .stat-card__label', key: 'jobsite.openShifts' },
    { selector: '.stat-row .stat-card:nth-child(3) .stat-card__label', key: 'jobsite.closedShifts' },
    { selector: '#jobsiteProfileEditBtn', key: 'common.edit' },
    { selector: '#jobsiteProfileEditForm button[type="submit"]', key: 'common.saveProfile' },
    { selector: '#jobsiteProfileEditCancel', key: 'common.cancel' },
    { selector: '#portalAccountSectionTitle', key: 'account.accountTitle' },
    { selector: 'label[for="portalAccountName"]', key: 'account.fullName' },
    { selector: 'label[for="portalAccountUserId"]', key: 'account.userId' },
    { selector: 'label[for="portalAccountEmail"]', key: 'account.currentEmail' },
    { selector: 'label[for="portalNewEmail"]', key: 'account.changeEmail' },
    { selector: '#portalNewEmail', key: 'account.changeEmailPlaceholder', property: 'placeholder' },
    { selector: 'label[for="portalCurrentCredential"]', key: 'account.currentCredential' },
    { selector: '#portalCurrentCredential', key: 'account.currentCredentialPlaceholder', property: 'placeholder' },
    { selector: 'label[for="portalNewPassword"]', key: 'account.newPassword' },
    { selector: '#portalNewPassword', key: 'account.newPasswordPlaceholder', property: 'placeholder' },
    { selector: 'label[for="portalNewPasscode"]', key: 'account.newPasscode' },
    { selector: '#portalNewPasscode', key: 'account.newPasscodePlaceholder', property: 'placeholder' },
    { selector: 'label[for="portalAccountCompanyName"]', key: 'account.companyName' },
    { selector: 'label[for="portalAccountContactName"]', key: 'account.contactName' },
    { selector: 'label[for="portalAccountPhone"]', key: 'common.phone' },
    { selector: 'label[for="portalAccountAddress"]', key: 'common.streetAddress' },
    { selector: 'label[for="portalAccountCity"]', key: 'common.city' },
    { selector: 'label[for="portalAccountState"]', key: 'common.state' },
    { selector: 'label[for="portalAccountZip"]', key: 'common.zipCode' },
    { selector: 'label[for="portalRemovePasscode"]', key: 'account.removeStoredPasscode' },
    { selector: '#portalAccountForm button[type="submit"]', key: 'common.saveAccountSettings' },
  ],
};

let portalLanguage = PORTAL_DEFAULT_LANGUAGE;

function getStoredPortalLanguage() {
  try {
    const stored = localStorage.getItem(PORTAL_LANGUAGE_KEY);
    return PORTAL_LANGUAGE_LABELS[stored] ? stored : PORTAL_DEFAULT_LANGUAGE;
  } catch (_error) {
    return PORTAL_DEFAULT_LANGUAGE;
  }
}

function translateTemplate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_match, key) => (vars[key] === undefined ? '' : String(vars[key])));
}

function getTranslationValue(key, vars = {}) {
  const keys = String(key || '').split('.').filter(Boolean);
  const languages = [portalLanguage, PORTAL_DEFAULT_LANGUAGE];

  for (const language of languages) {
    let value = PORTAL_TRANSLATIONS[language];
    for (const part of keys) {
      value = value && typeof value === 'object' ? value[part] : undefined;
    }
    if (typeof value === 'string') {
      return translateTemplate(value, vars);
    }
  }

  return key;
}

function t(key, vars = {}) {
  return getTranslationValue(key, vars);
}

function isEmployeePortalPage() {
  return String(document.body?.dataset?.portalPage || '').trim().toLowerCase() === 'employee';
}

function setPortalDocumentLanguage(language) {
  const normalized = PORTAL_LANGUAGE_LABELS[language] ? language : PORTAL_DEFAULT_LANGUAGE;
  portalLanguage = normalized;
  if (document && document.documentElement) {
    document.documentElement.lang = normalized === 'en' ? 'en-GB' : normalized;
    document.documentElement.dir = PORTAL_RTL_LANGUAGES.has(normalized) ? 'rtl' : 'ltr';
  }
  if (document && document.body) {
    document.body.classList.toggle('portal-page--rtl', PORTAL_RTL_LANGUAGES.has(normalized));
    document.body.dataset.language = normalized;
  }
  try {
    localStorage.setItem(PORTAL_LANGUAGE_KEY, normalized);
  } catch (_error) {
    // Ignore storage failures.
  }
}

function applyPortalStaticTranslations() {
  const pageType = String(document.body?.dataset?.portalPage || '').trim().toLowerCase();
  const bindings = [
    ...(PORTAL_STATIC_TRANSLATION_BINDINGS.common || []),
    ...(PORTAL_STATIC_TRANSLATION_BINDINGS[pageType] || []),
  ];

  bindings.forEach((binding) => {
    const element = document.querySelector(binding.selector);
    if (!element) return;
    const property = binding.property || 'textContent';
    element[property] = t(binding.key, binding.vars || {});
  });

  const selector = document.getElementById('portalLanguageSelect');
  if (selector) {
    selector.value = portalLanguage;
    Array.from(selector.options).forEach((option) => {
      const label = PORTAL_LANGUAGE_LABELS[option.value];
      if (label) option.textContent = label;
    });
  }
}

if (document && document.documentElement) {
  setPortalDocumentLanguage(isEmployeePortalPage() ? getStoredPortalLanguage() : PORTAL_DEFAULT_LANGUAGE);
}

function setMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = 'form-message';
  if (type === 'error') element.classList.add('form-message--error');
  if (type === 'success') element.classList.add('form-message--success');
  if (type === 'neutral') element.classList.add('form-message--neutral');
  element.style.display = 'block';
}

function hideMessage(element) {
  if (!element) return;
  element.style.display = 'none';
  element.textContent = '';
  element.className = 'form-message';
}

function sanitizePortalRedirectTarget(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return '';
    if (!url.pathname.startsWith('/portal-')) return '';
    if (url.pathname === '/portal-login') return '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch (_error) {
    return '';
  }
}

function getPortalRedirectTargetFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return sanitizePortalRedirectTarget(params.get('redirect'));
}

function getCurrentPortalRelativeUrl() {
  return sanitizePortalRedirectTarget(`${window.location.pathname}${window.location.search}${window.location.hash}`);
}

function buildPortalLoginRedirectPath(targetPath = '', extraParams = {}) {
  const loginPath = IS_FILE_PROTOCOL ? 'portal-login.html' : '/portal-login';
  const url = new URL(loginPath, window.location.origin);
  const safeTarget = sanitizePortalRedirectTarget(targetPath);
  if (safeTarget) {
    url.searchParams.set('redirect', safeTarget);
  }
  Object.entries(extraParams || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return `${url.pathname}${url.search}${url.hash}`;
}

function saveToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

function getPortalTheme() {
  try {
    return localStorage.getItem(PORTAL_THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch (_error) {
    return 'light';
  }
}

function setPortalTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  try {
    localStorage.setItem(PORTAL_THEME_KEY, normalizedTheme);
  } catch (_error) {
    // Ignore storage write failures (private mode or blocked storage)
  }

  const darkEnabled = normalizedTheme === 'dark';
  document.body.classList.toggle('theme-dark', darkEnabled);
  document.body.dataset.theme = normalizedTheme;

  const btn = document.getElementById('portalThemeToggleBtn');
  if (btn) {
    btn.textContent = darkEnabled ? t('header.switchToLightMode') : t('header.switchToDarkMode');
    btn.classList.toggle('button--secondary', darkEnabled);
  }

  applyPortalStaticTranslations();
}

function bindPortalThemeToggle() {
  const btn = document.getElementById('portalThemeToggleBtn');
  if (!btn || btn.dataset.bound === '1') return;

  setPortalTheme(getPortalTheme());
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    setPortalTheme(getPortalTheme() === 'dark' ? 'light' : 'dark');
  });
}

function asInt(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function formatPhoneDisplay(value) {
  const digits = phoneDigits(value);
  if (!digits) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatPhoneForView(value, fallback = 'Not set') {
  const formatted = formatPhoneDisplay(value);
  return formatted || fallback;
}

function formatBackgroundStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'passed') return 'Passed';
  if (normalized === 'needs_further_attention') return 'Needs further attention';
  return 'Pending review';
}

function backgroundStatusBadge(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'passed') return '<span class="badge badge--green">Passed</span>';
  if (normalized === 'needs_further_attention') return '<span class="badge badge--red">Needs further attention</span>';
  return '<span class="badge badge--yellow">Pending review</span>';
}

function formatList(items, emptyMessage) {
  if (!Array.isArray(items) || items.length === 0) {
    return emptyMessage;
  }
  return items.join(' | ');
}

const adminState = {
  users: [],
  jobs: [],
  employees: [],
  documents: [],
  assignments: [],
  timesheets: [],
  excuseForms: [],
  contractsBank: [],
  contractsAll: [],
  contractsWarehouse: [],
  contractsHealthcare: [],
  miscSendRecipients: null,
  currentAdminId: null,
  selectedEmployeeId: null,
  selectedEmployeeDetail: null,
  selectedTimesheetEmployeeId: null,
};

const HEALTHCARE_INDUSTRIES = new Set(['healthcare', 'cna', 'cma', 'rn', 'lpn', 'lvn', 'dietary']);
const ZIP_LOOKUP_CACHE = new Map();
const EMPLOYEE_REGISTRATION_OPTIONS = {
  warehouse: [
    { industry: 'warehouse', position: 'Forklift Operator' },
    { industry: 'warehouse', position: 'Material Handler' },
    { industry: 'warehouse', position: 'Pick / Pack Specialist' },
    { industry: 'warehouse', position: 'Inventory Control' },
    { industry: 'warehouse', position: 'Loader / Unloader' },
    { industry: 'warehouse', position: 'Returns Specialist (Reverse Logistics)' },
    { industry: 'warehouse', position: 'Maintenance Technician' },
    { industry: 'warehouse', position: 'Order Selector / Puller' },
  ],
  healthcare: [
    { industry: 'cna', position: 'Certified Nursing Assistant (CNA)' },
    { industry: 'lpn', position: 'Licensed Practical Nurse (LPN)' },
    { industry: 'rn', position: 'Registered Nurse (RN)' },
    { industry: 'cma', position: 'Certified Medical Assistant (CMA)' },
    { industry: 'dietary', position: 'Dietary Aide' },
  ],
};

const JOBSITE_TRACK_INDUSTRY_OPTIONS = {
  warehouse: [
    { value: 'warehouse', label: 'Warehouse + Logistics' },
  ],
  healthcare: [
    { value: 'healthcare', label: 'Health Care' },
  ],
};

const JOBSITE_TRACK_TITLE_OPTIONS = {
  warehouse: [
    { value: 'Forklift Operator', label: 'Forklift Operator' },
    { value: 'Material Handler', label: 'Material Handler' },
    { value: 'Pick / Pack Specialist', label: 'Pick / Pack Specialist' },
    { value: 'Inventory Control', label: 'Inventory Control' },
    { value: 'Loader / Unloader', label: 'Loader / Unloader' },
    { value: 'Returns Specialist (Reverse Logistics)', label: 'Returns Specialist (Reverse Logistics)' },
    { value: 'Maintenance Technician', label: 'Maintenance Technician' },
    { value: 'Order Selector / Puller', label: 'Order Selector / Puller' },
  ],
  healthcare: [
    { value: 'Certified Nursing Assistant (CNA)', label: 'Certified Nursing Assistant (CNA)' },
    { value: 'Licensed Practical Nurse (LPN)', label: 'Licensed Practical Nurse (LPN)' },
    { value: 'Registered Nurse (RN)', label: 'Registered Nurse (RN)' },
    { value: 'Certified Medical Assistant (CMA)', label: 'Certified Medical Assistant (CMA)' },
    { value: 'Dietary Aide', label: 'Dietary Aide' },
  ],
};

function formatIndustryTrackLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'healthcare') return 'Healthcare';
  return 'Warehouse';
}

function industryToTrack(industry) {
  const normalized = String(industry || '').trim().toLowerCase();
  if (HEALTHCARE_INDUSTRIES.has(normalized)) return 'healthcare';
  return 'warehouse';
}

function formatIndustryDisplay(industry) {
  const track = industryToTrack(industry);
  return formatIndustryTrackLabel(track);
}

function formatEmployeeIndustryTypeLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'warehouse') return 'Warehouse';
  if (normalized === 'healthcare') return 'Healthcare';
  if (normalized === 'cna') return 'CNA';
  if (normalized === 'cma') return 'CMA';
  if (normalized === 'rn') return 'RN';
  if (normalized === 'lpn') return 'LPN';
  if (normalized === 'lvn') return 'LVN';
  if (normalized === 'dietary') return 'Dietary';
  return String(value)
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveEmployeeHeaderData(source = {}) {
  const employee = source.employee || {};
  const profile = source.profile || {};
  const applications = Array.isArray(source.applications) ? source.applications : [];
  const latestApplication = applications[0] || {};
  const industryType = String(
    source.industryType || employee.industryType || profile.industryType || latestApplication.industry || ''
  ).trim();
  const positionTitle = String(
    source.positionTitle || employee.positionTitle || profile.positionTitle || latestApplication.position || ''
  ).trim();
  const industryTrack = String(
    source.industryTrack || employee.industryTrack || profile.industryTrack || source.compliance?.track || industryToTrack(industryType)
  ).trim().toLowerCase();

  return {
    industryType,
    positionTitle,
    industryTrack,
    hasWarehouseContext: industryTrack === 'warehouse',
  };
}

function renderEmployeeHeaderComponent(source = {}, options = {}) {
  const header = resolveEmployeeHeaderData(source);
  const badges = [];
  const industryLabel = formatEmployeeIndustryTypeLabel(header.industryType || header.industryTrack);

  if (header.hasWarehouseContext && industryLabel && industryLabel.toLowerCase() !== 'warehouse') {
    badges.push('<span class="badge badge--green">Warehouse</span>');
  }

  if (industryLabel) {
    badges.push(`<span class="badge badge--blue">${escapeHtml(industryLabel)}</span>`);
  }

  const titleMarkup = header.positionTitle
    ? `<span class="employee-header__title">${escapeHtml(header.positionTitle)}</span>`
    : '';

  if (!badges.length && !titleMarkup) {
    return '';
  }

  const classNames = ['employee-header'];
  if (options.surface) classNames.push('employee-header--surface');

  return `<div class="${classNames.join(' ')}">${badges.join('')}${titleMarkup}</div>`;
}

function renderEmployeeHeaderInto(element, source = {}, options = {}) {
  if (!element) return;
  const markup = renderEmployeeHeaderComponent(source, options);
  element.innerHTML = markup;
  element.hidden = !markup;
}

function normalizeIndustryTrack(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'healthcare') return 'healthcare';
  if (normalized === 'warehouse') return 'warehouse';
  return '';
}

function applyJobsiteIndustryTrackToForms(track) {
  const normalizedTrack = normalizeIndustryTrack(track) || 'warehouse';
  const options = JOBSITE_TRACK_INDUSTRY_OPTIONS[normalizedTrack] || JOBSITE_TRACK_INDUSTRY_OPTIONS.warehouse;
  const fixedOption = options[0] || { value: 'warehouse', label: 'Warehouse + Logistics' };

  const createIndustryInput = document.getElementById('jobIndustry');
  if (createIndustryInput) {
    createIndustryInput.value = String(fixedOption.value || '').trim();
  }

  const createIndustryLabel = document.getElementById('jobIndustryLabel');
  if (createIndustryLabel) {
    createIndustryLabel.value = String(fixedOption.label || '').trim();
  }

  const editIndustryInput = document.getElementById('editJobIndustry');
  if (editIndustryInput) {
    editIndustryInput.value = String(fixedOption.value || '').trim();
  }

  const editIndustryLabel = document.getElementById('editJobIndustryLabel');
  if (editIndustryLabel) {
    editIndustryLabel.value = String(fixedOption.label || '').trim();
  }

  const titleOptions = JOBSITE_TRACK_TITLE_OPTIONS[normalizedTrack] || JOBSITE_TRACK_TITLE_OPTIONS.warehouse;

  const syncTitleSelect = (selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = String(select.value || '').trim();
    const baseOptions = ['<option value="">Select position</option>'];
    baseOptions.push(
      ...titleOptions.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    );

    if (currentValue && !titleOptions.some((option) => option.value === currentValue)) {
      baseOptions.push(`<option value="${escapeHtml(currentValue)}">${escapeHtml(currentValue)}</option>`);
    }

    select.innerHTML = baseOptions.join('');
    if (currentValue) {
      select.value = currentValue;
    }
  };

  syncTitleSelect('jobTitle');
  syncTitleSelect('editJobTitle');

  // Show STAT PAY only for healthcare, hide for warehouse
  const isHealthcare = normalizedTrack === 'healthcare';
  
  // Find all STAT PAY checkbox rows (both in create and edit forms)
  const allStatPayRows = document.querySelectorAll('.form-row.admin-checkbox-row');
  allStatPayRows.forEach((row) => {
    row.style.display = isHealthcare ? '' : 'none';
    if (isHealthcare) {
      row.classList.add('admin-checkbox-row--tight');
    } else {
      row.classList.remove('admin-checkbox-row--tight');
    }
  });
}

const DOCUMENT_TYPE_LABELS = {
  resume: 'Resume',
  id_or_drivers_license: "ID / Driver's License",
  background_check: 'Background Check',
  background_acknowledgment_consent: 'Background Acknowledgment & Consent',
  hipaa_compliance_acknowledgment: 'HIPAA Compliance & Confidentiality Acknowledgment',
  background_clearance_form: 'Completed Background Form',
  doctor_note: 'Doctor Note',
  social_security_or_work_authorization: 'Social Security Card / Work Authorization Permit',
  tuberculosis_screening_tb: 'Tuberculosis Screening (TB)',
  hepatitis_b: 'Hepatitis B',
  mmr_varicella: 'MMR / Varicella',
  license_or_certification: 'License / Certification',
  cpr_bls_certificate: 'CPR / BLS Certificate',
  dependent_adult_abuse_training: 'Dependent Adult Abuse Mandatory Reporter Training',
  covid19_vaccine_card: 'Covid-19 Vaccine Card',
  covid19_religious_exemption_form: 'Covid-19 Religious Exemption Form (signed by primary provider)',
  physical_form: 'Physical Form',
  other: 'Other',
};

const EMPLOYEE_WEB_FORM_CONFIGS = {
  'background-consent': {
    key: 'background-consent',
    dataKey: 'backgroundConsentForm',
    documentType: 'background_acknowledgment_consent',
    title: 'Background Acknowledgment & Consent',
    templateId: 'employeeBackgroundConsentTemplate',
    endpoint: '/api/portal/employee/background-consent',
    badgeId: 'employeeTodoBackgroundBadge',
    summaryId: 'employeeTodoBackgroundSummary',
    pendingSummary: 'Open the form, review the disclosure, and sign to complete this onboarding item.',
    unlockMessage: 'You reached the bottom. Acknowledge the disclosure and sign to save your background consent.',
    lockedMessage: 'Scroll to the bottom of the form to unlock the acknowledgment and electronic signature fields.',
    acknowledgmentText: 'I have read the full background acknowledgment and consent disclosure, understand it, and agree to sign electronically.',
    successMessage: 'Background acknowledgment and consent saved successfully.',
    errorMessage: 'Failed to save the background acknowledgment and consent form.',
  },
  'hipaa-compliance': {
    key: 'hipaa-compliance',
    dataKey: 'hipaaComplianceForm',
    documentType: 'hipaa_compliance_acknowledgment',
    title: 'HIPAA Compliance & Confidentiality',
    templateId: 'employeeHipaaComplianceTemplate',
    endpoint: '/api/portal/employee/hipaa-compliance',
    badgeId: 'employeeTodoHipaaBadge',
    summaryId: 'employeeTodoHipaaSummary',
    pendingSummary: 'Open the HIPAA compliance form, review your confidentiality obligations, and sign before working assignments.',
    unlockMessage: 'You reached the bottom. Acknowledge the HIPAA compliance statement and sign to save it to your profile.',
    lockedMessage: 'Scroll to the bottom of the HIPAA form to unlock the acknowledgment and electronic signature fields.',
    acknowledgmentText: 'I have read the full HIPAA compliance and confidentiality statement, understand my obligations, and agree to sign electronically.',
    successMessage: 'HIPAA compliance acknowledgment saved successfully.',
    errorMessage: 'Failed to save the HIPAA compliance acknowledgment.',
  },
  'employee-handbook': {
    key: 'employee-handbook',
    dataKey: 'handbookForm',
    documentType: 'employee_handbook_acknowledgment',
    title: 'Employee Handbook',
    templateId: 'employeeHandbookTemplate',
    endpoint: '/api/portal/employee/employee-handbook',
    badgeId: 'employeeTodoHandbookBadge',
    summaryId: 'employeeTodoHandbookSummary',
    pendingSummary: 'Open the Employee Handbook, read it in full, and sign to acknowledge the policies and expectations.',
    unlockMessage: 'You reached the bottom. Acknowledge the Employee Handbook and sign to save it to your profile.',
    lockedMessage: 'Scroll to the bottom of the Employee Handbook to unlock the acknowledgment and electronic signature fields.',
    acknowledgmentText: 'I have read the full Employee Handbook, understand the policies and expectations, and agree to sign electronically.',
    successMessage: 'Employee Handbook acknowledgment saved successfully.',
    errorMessage: 'Failed to save the Employee Handbook acknowledgment.',
  },
  'compensation-agreement': {
    key: 'compensation-agreement',
    dataKey: 'compensationAgreementForm',
    documentType: 'employee_compensation_agreement',
    title: 'Employee Compensation Agreement',
    templateId: 'employeeCompensationAgreementTemplate',
    endpoint: '/api/portal/employee/compensation-agreement',
    badgeId: 'employeeTodoCompBadge',
    summaryId: 'employeeTodoCompSummary',
    pendingSummary: 'Open the Employee Compensation Agreement, review your pay rate and travel pay policy, and sign to complete this onboarding item.',
    unlockMessage: 'You reached the bottom. Acknowledge the compensation agreement and sign to save it to your profile.',
    lockedMessage: 'Scroll to the bottom of the form to unlock the acknowledgment and electronic signature fields.',
    acknowledgmentText: 'I have read the full Employee Compensation Agreement, understand my pay rate and travel pay policy, and agree to sign electronically.',
    successMessage: 'Employee Compensation Agreement saved successfully.',
    errorMessage: 'Failed to save the Employee Compensation Agreement.',
    healthcareOnly: true,
  },
};

let EXPIRATION_REQUIRED_TYPES = new Set([
  'tuberculosis_screening_tb',
  'license_or_certification',
  'cpr_bls_certificate',
  'dependent_adult_abuse_training',
]);

let portalCurrentUserId = null;
let portalCurrentUser = null;
let employeeDashboardPayload = null;
let jobsiteDashboardPayload = null;
let employeeOnboardingStatus = 'registered';
let employeeCompliance = null;
let employeeUnsubmittedClockEntries = [];
let portalMessageLiveTimer = null;
let portalMessageLiveInFlight = false;
let portalMessageLiveBound = false;
let portalSelectedThreadUserId = null;
let portalNotificationInFlight = false;
let portalRealtimeSource = null;
let portalRealtimeBound = false;
let portalRealtimeReconnectTimer = null;
let portalRealtimeReconnectAttempts = 0;
let portalWidgetLayoutBound = false;
let portalDrawerOverlay = null;
let portalDrawerContent = null;
let portalDrawerStash = null;
let portalDrawerActiveSection = null;
let portalDrawerReturnTarget = null;
let portalSmtpConfigured = true;

function getEmployeeMissingComplianceItem(compliance = employeeCompliance) {
  const items = Array.isArray(compliance && compliance.items) ? compliance.items : [];
  return items.find((item) => item.required && (item.missingRequired || item.missingExpiration)) || null;
}

function getEmployeeOnboardingBlockMessage(compliance = employeeCompliance, actionPhrase = 'continue') {
  const item = getEmployeeMissingComplianceItem(compliance);
  if (item && (item.documentType === 'background_acknowledgment_consent' || item.documentType === 'hipaa_compliance_acknowledgment')) {
    return `Complete the ${DOCUMENT_TYPE_LABELS[item.documentType] || item.documentType} form before you can ${actionPhrase}.`;
  }
  if (item) {
    const label = DOCUMENT_TYPE_LABELS[item.documentType] || item.documentType || 'this requirement';
    if (item.missingExpiration) {
      return `Add the required expiration details for ${label} before you can ${actionPhrase}.`;
    }
    return `Complete ${label} before you can ${actionPhrase}.`;
  }
  return `Complete required onboarding items before you can ${actionPhrase}.`;
}

function openBackgroundDisclosureNotice(download = false) {
  const url = '/background-disclosure-notice.html';
  if (download) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Progress-Staffing-Background-Disclosure-Notice.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }
  window.open(url, '_blank', 'noopener');
}

function getEmployeeWebFormConfig(formKey) {
  return EMPLOYEE_WEB_FORM_CONFIGS[String(formKey || '').trim().toLowerCase()] || null;
}

function getSignedOnboardingFormUrl(formType, employeeUserId, download = false) {
  const normalizedType = String(formType || '').trim().toLowerCase();
  const normalizedEmployeeId = Number(employeeUserId);
  if (!normalizedType || !Number.isInteger(normalizedEmployeeId) || normalizedEmployeeId < 1) return '';
  const url = `/api/portal/forms/${encodeURIComponent(normalizedType)}/${normalizedEmployeeId}`;
  return download ? `${url}?download=1` : url;
}

function buildEmployeeWebFormStatusText(formRecord, pendingText) {
  if (!formRecord || !formRecord.acknowledged) return pendingText;
  return `Signed by ${formRecord.signatureName || formRecord.legalName || 'employee'} on ${formatDateOnly(formRecord.signedDate)}.`;
}

function applyEmployeeWebFormCardState(config, formRecord) {
  const badgeEl = document.getElementById(config.badgeId);
  const summaryEl = document.getElementById(config.summaryId);
  const isSigned = Boolean(formRecord && formRecord.acknowledged);

  if (badgeEl) {
    badgeEl.className = `badge ${isSigned ? 'badge--green' : 'badge--yellow'}`;
    badgeEl.textContent = isSigned ? 'Signed' : 'Pending';
  }

  if (summaryEl) {
    summaryEl.textContent = buildEmployeeWebFormStatusText(formRecord, config.pendingSummary);
  }

  const formCard = document.querySelector(`[data-employee-form-card="${config.key}"]`);
  if (formCard && isSigned) {
    const viewBtn = formCard.querySelector(`[data-employee-form-view="${config.key}"]`);
    if (viewBtn) viewBtn.hidden = false;
  } else if (formCard) {
    const viewBtn = formCard.querySelector(`[data-employee-form-view="${config.key}"]`);
    if (viewBtn) viewBtn.hidden = true;
  }
}

function renderEmployeeTodoForms(data) {
  const todoSection = document.getElementById('employeeTodosSection');
  if (!todoSection) return;

  const industry = inferPrimaryIndustry(data.applications || []);
  const isHealthcare = HEALTHCARE_INDUSTRIES.has(String(industry).toLowerCase());

  // Show/hide the healthcare-only compensation agreement card
  const compCard = document.querySelector('[data-employee-form-card="compensation-agreement"]');
  if (compCard) compCard.hidden = !isHealthcare;

  let pendingCount = 0;
  Object.values(EMPLOYEE_WEB_FORM_CONFIGS).forEach((config) => {
    if (config.healthcareOnly && !isHealthcare) return;
    const record = data && data[config.dataKey] ? data[config.dataKey] : null;
    applyEmployeeWebFormCardState(config, record);
    if (!(record && record.acknowledged)) pendingCount += 1;
  });

  todoSection.dataset.tileSummary = pendingCount === 0
    ? 'All required web forms signed'
    : `${pendingCount} required form${pendingCount === 1 ? '' : 's'} pending`;
  refreshPortalTileSummaryForSection(todoSection);
}

function getChecklistTemplate(industry) {
  const isHealthcare = HEALTHCARE_INDUSTRIES.has(String(industry || '').toLowerCase());

  if (!isHealthcare) {
    return [
      { type: 'resume', label: DOCUMENT_TYPE_LABELS.resume, required: false },
      { type: 'id_or_drivers_license', label: DOCUMENT_TYPE_LABELS.id_or_drivers_license, required: true, requiresExpiration: true },
      {
        type: 'social_security_or_work_authorization',
        label: DOCUMENT_TYPE_LABELS.social_security_or_work_authorization,
        required: true,
      },
      { type: 'physical_form', label: DOCUMENT_TYPE_LABELS.physical_form, required: true },
    ];
  }

  return [
    { type: 'resume', label: DOCUMENT_TYPE_LABELS.resume, required: true },
    { type: 'id_or_drivers_license', label: DOCUMENT_TYPE_LABELS.id_or_drivers_license, required: true },
    {
      type: 'social_security_or_work_authorization',
      label: DOCUMENT_TYPE_LABELS.social_security_or_work_authorization,
      required: true,
    },
    { type: 'hepatitis_b', label: DOCUMENT_TYPE_LABELS.hepatitis_b, required: true },
    { type: 'mmr_varicella', label: DOCUMENT_TYPE_LABELS.mmr_varicella, required: true },
    {
      type: 'tuberculosis_screening_tb',
      label: DOCUMENT_TYPE_LABELS.tuberculosis_screening_tb,
      required: true,
      requiresExpiration: true,
    },
    {
      type: 'license_or_certification',
      label: DOCUMENT_TYPE_LABELS.license_or_certification,
      required: true,
      requiresExpiration: true,
    },
    {
      type: 'cpr_bls_certificate',
      label: DOCUMENT_TYPE_LABELS.cpr_bls_certificate,
      required: true,
      requiresExpiration: true,
    },
    {
      type: 'dependent_adult_abuse_training',
      label: DOCUMENT_TYPE_LABELS.dependent_adult_abuse_training,
      required: true,
      requiresExpiration: true,
    },
    { type: 'covid19_vaccine_card', label: DOCUMENT_TYPE_LABELS.covid19_vaccine_card, required: true },
    { type: 'covid19_religious_exemption_form', label: DOCUMENT_TYPE_LABELS.covid19_religious_exemption_form, required: true },
    { type: 'physical_form', label: DOCUMENT_TYPE_LABELS.physical_form, required: true },
  ];
}

function inferPrimaryIndustry(applications) {
  if (!Array.isArray(applications) || applications.length === 0) return 'warehouse';
  const latest = applications[0];
  return String(latest.industry || 'warehouse').toLowerCase();
}

const EXPIRATION_NOT_APPLICABLE = new Set(['resume', 'social_security_or_work_authorization', 'covid19_vaccine_card', 'covid19_religious_exemption_form', 'background_clearance_form']);

function updateExpirationFieldState(docType) {
  const input = document.getElementById('employeeDocumentExpirationDate');
  const row = input && input.closest('.form-row');
  if (!input) return;
  const noExp = EXPIRATION_NOT_APPLICABLE.has(docType);
  input.disabled = noExp;
  input.value = noExp ? '' : input.value;
  if (row) row.style.opacity = noExp ? '0.4' : '';
}

function syncEmployeeSsnVerificationFields(docType) {
  const wrap = document.getElementById('employeeSsnVerificationFields');
  const ssnInput = document.getElementById('employeeDocumentSsn');
  const confirmInput = document.getElementById('employeeDocumentSsnConfirm');
  if (!wrap) return;

  const needsSsnVerification = String(docType || '').trim().toLowerCase() === 'social_security_or_work_authorization';
  wrap.hidden = !needsSsnVerification;

  if (!needsSsnVerification) {
    if (ssnInput) ssnInput.value = '';
    if (confirmInput) confirmInput.checked = false;
  }
}

function syncW9ConditionalFields(form) {
  if (!form) return;
  const classification = form.taxClassification ? form.taxClassification.value : '';
  const llcRow = document.getElementById('w9LlcTypeRow');
  const otherRow = document.getElementById('w9OtherClassificationRow');
  if (llcRow) llcRow.hidden = classification !== 'llc';
  if (otherRow) otherRow.hidden = classification !== 'other';
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildEmployeeW4Payload(form) {
  return {
    legalName: form.legalName.value.trim(),
    addressLine: form.addressLine.value.trim(),
    cityStateZip: form.cityStateZip.value.trim(),
    filingStatus: form.filingStatus.value,
    multipleJobs: form.multipleJobs.value,
    dependentsAmount: form.dependentsAmount.value,
    otherIncome: form.otherIncome.value,
    deductions: form.deductions.value,
    extraWithholding: form.extraWithholding.value,
    signatureName: form.signatureName.value.trim(),
    signedDate: form.signedDate.value,
  };
}

function buildEmployeeW9Payload(form) {
  const classification = form.taxClassification.value;
  return {
    name: form.name.value.trim(),
    businessName: form.businessName.value.trim(),
    taxClassification: classification,
    llcType: classification === 'llc' ? (form.llcType ? form.llcType.value : '') : '',
    otherClassification: classification === 'other' ? (form.otherClassification ? form.otherClassification.value.trim() : '') : '',
    exemptPayeeCode: form.exemptPayeeCode.value.trim(),
    fatcaExemptionCode: form.fatcaExemptionCode.value.trim(),
    addressLine: form.addressLine.value.trim(),
    cityStateZip: form.cityStateZip.value.trim(),
    tin: form.tin.value.trim(),
    signatureName: form.signatureName.value.trim(),
    signedDate: form.signedDate.value,
  };
}

function syncEmployeeTaxFormSnapshot(form, formType) {
  if (!form) return;
  const payload = formType === 'w9' ? buildEmployeeW9Payload(form) : buildEmployeeW4Payload(form);
  form.dataset.savedState = JSON.stringify(payload);
}

function resetEmployeeW4Form(form) {
  if (!form) return;
  form.reset();
  if (form.multipleJobs) form.multipleJobs.value = '0';
  if (form.signedDate) form.signedDate.value = getTodayIsoDate();
}

function applyEmployeeW4Form(form, data) {
  if (!form) return;
  resetEmployeeW4Form(form);
  if (data) {
    form.legalName.value = data.legalName || '';
    form.addressLine.value = data.addressLine || '';
    form.cityStateZip.value = data.cityStateZip || '';
    form.filingStatus.value = data.filingStatus || '';
    form.multipleJobs.value = String(data.multipleJobs || 0);
    form.dependentsAmount.value = data.dependentsAmount ?? '';
    form.otherIncome.value = data.otherIncome ?? '';
    form.deductions.value = data.deductions ?? '';
    form.extraWithholding.value = data.extraWithholding ?? '';
    form.signatureName.value = data.signatureName || '';
    form.signedDate.value = data.signedDate || getTodayIsoDate();
  }
  syncEmployeeTaxFormSnapshot(form, 'w4');
}

function resetEmployeeW9Form(form) {
  if (!form) return;
  form.reset();
  if (form.signedDate) form.signedDate.value = getTodayIsoDate();
  syncW9ConditionalFields(form);
}

function applyEmployeeW9Form(form, data) {
  if (!form) return;
  resetEmployeeW9Form(form);
  if (data) {
    form.name.value = data.name || '';
    form.businessName.value = data.businessName || '';
    form.taxClassification.value = data.taxClassification || '';
    syncW9ConditionalFields(form);
    if (form.llcType) form.llcType.value = data.llcType || '';
    if (form.otherClassification) form.otherClassification.value = data.otherClassification || '';
    form.exemptPayeeCode.value = data.exemptPayeeCode || '';
    form.fatcaExemptionCode.value = data.fatcaExemptionCode || '';
    form.addressLine.value = data.addressLine || '';
    form.cityStateZip.value = data.cityStateZip || '';
    form.tin.value = data.tin || '';
    form.signatureName.value = data.signatureName || '';
    form.signedDate.value = data.signedDate || getTodayIsoDate();
  }
  syncW9ConditionalFields(form);
  syncEmployeeTaxFormSnapshot(form, 'w9');
}

function restoreEmployeeTaxFormSnapshot(form, formType) {
  if (!form) return;
  let snapshot = null;
  if (form.dataset.savedState) {
    try {
      snapshot = JSON.parse(form.dataset.savedState);
    } catch (error) {
      snapshot = null;
    }
  }

  if (formType === 'w9') {
    applyEmployeeW9Form(form, snapshot);
    return;
  }

  applyEmployeeW4Form(form, snapshot);
}

function hasUnsavedEmployeeTaxFormChanges(form, formType) {
  if (!form) return false;
  const currentState = JSON.stringify(formType === 'w9' ? buildEmployeeW9Payload(form) : buildEmployeeW4Payload(form));
  return currentState !== (form.dataset.savedState || '');
}

function formatTaxFormDetailValue(value) {
  if (value === undefined || value === null || value === '') return 'N/A';
  return escapeHtml(String(value));
}

function renderAdminTaxFormDetail(formType) {
  const panel = document.getElementById('adminTaxFormDetailPanel');
  const body = document.getElementById('adminTaxFormDetailBody');
  const detailMsg = document.getElementById('adminTaxFormDetailMessage');
  if (!panel || !body || !detailMsg) return;

  const detail = adminState.selectedEmployeeDetail || {};
  if (formType === 'w4' && detail.w4Form) {
    const form = detail.w4Form;
    const filingStatusLabels = {
      single: 'Single',
      married_filing_jointly: 'Married Filing Jointly',
      head_of_household: 'Head of Household',
    };
    body.innerHTML = `
      <div class="profile-info__item"><span class="profile-info__label">Form</span><span>Form W-4</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Legal Name</span><span>${formatTaxFormDetailValue(form.legalName)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Address</span><span>${formatTaxFormDetailValue(form.addressLine)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">City, State, Zip</span><span>${formatTaxFormDetailValue(form.cityStateZip)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Filing Status</span><span>${formatTaxFormDetailValue(filingStatusLabels[form.filingStatus] || form.filingStatus || '')}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Multiple Jobs</span><span>${Number(form.multipleJobs) === 1 ? 'Yes' : 'No'}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Dependents Amount</span><span>${formatTaxFormDetailValue(form.dependentsAmount)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Other Income</span><span>${formatTaxFormDetailValue(form.otherIncome)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Deductions</span><span>${formatTaxFormDetailValue(form.deductions)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Extra Withholding</span><span>${formatTaxFormDetailValue(form.extraWithholding)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Signature</span><span>${formatTaxFormDetailValue(form.signatureName)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Signed Date</span><span>${escapeHtml(form.signedDate ? formatDateOnly(form.signedDate) : 'N/A')}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Last Updated</span><span>${escapeHtml(form.updatedAt ? formatDateTime(form.updatedAt) : 'N/A')}</span></div>
    `;
    setMessage(detailMsg, 'Saved W-4 record loaded.', 'success');
  } else if (formType === 'w9' && detail.w9Form) {
    const form = detail.w9Form;
    const classificationLabels = {
      individual_sole_proprietor: 'Individual / Sole Proprietor / Single-Member LLC',
      c_corporation: 'C Corporation',
      s_corporation: 'S Corporation',
      partnership: 'Partnership',
      trust_estate: 'Trust / Estate',
      llc: 'Limited Liability Company (LLC)',
      other: 'Other',
    };
    body.innerHTML = `
      <div class="profile-info__item"><span class="profile-info__label">Form</span><span>Form W-9</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Name</span><span>${formatTaxFormDetailValue(form.name)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Business Name</span><span>${formatTaxFormDetailValue(form.businessName)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Tax Classification</span><span>${formatTaxFormDetailValue(classificationLabels[form.taxClassification] || form.taxClassification || '')}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">LLC Type</span><span>${formatTaxFormDetailValue(form.llcType)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Other Classification</span><span>${formatTaxFormDetailValue(form.otherClassification)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Exempt Payee Code</span><span>${formatTaxFormDetailValue(form.exemptPayeeCode)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">FATCA Exemption Code</span><span>${formatTaxFormDetailValue(form.fatcaExemptionCode)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Address</span><span>${formatTaxFormDetailValue(form.addressLine)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">City, State, Zip</span><span>${formatTaxFormDetailValue(form.cityStateZip)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">TIN</span><span>${formatTaxFormDetailValue(form.tin)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Signature</span><span>${formatTaxFormDetailValue(form.signatureName)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Signed Date</span><span>${escapeHtml(form.signedDate ? formatDateOnly(form.signedDate) : 'N/A')}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">Last Updated</span><span>${escapeHtml(form.updatedAt ? formatDateTime(form.updatedAt) : 'N/A')}</span></div>
    `;
    setMessage(detailMsg, 'Saved W-9 record loaded.', 'success');
  } else {
    body.innerHTML = '';
    setMessage(detailMsg, 'No tax form details are available for this employee.', 'error');
  }

  panel.hidden = false;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function populateDocumentTypeSelect(industry) {
  const sel = document.getElementById('employeeDocumentType');
  if (!sel) return;
  const types = [
    ...getChecklistTemplate(industry),
    { type: 'background_clearance_form', label: DOCUMENT_TYPE_LABELS.background_clearance_form },
    { type: 'other', label: DOCUMENT_TYPE_LABELS.other },
  ];
  const current = sel.value;
  sel.innerHTML = types
    .map(t => `<option value="${t.type}">${t.label}</option>`)
    .join('');
  if (current && types.some(t => t.type === current)) sel.value = current;

  // Rebuild the expiration-required set for this industry
  EXPIRATION_REQUIRED_TYPES = new Set(
    types.filter(t => t.requiresExpiration).map(t => t.type)
  );

  // Update the expiration label to reflect which types need a date
  const expirationLabel = document.getElementById('employeeExpirationDateLabel');
  if (expirationLabel) {
    const isHealthcare = HEALTHCARE_INDUSTRIES.has(String(industry || '').toLowerCase());
    const hint = isHealthcare
      ? 'required for TB Screening, License/Certification, CPR/BLS, and Abuse Training'
      : "required for Driver's License";
    expirationLabel.innerHTML = `Expiration Date <span style="font-weight:400;opacity:0.7">(${hint})</span>`;
  }

  // Set initial disabled state for the currently selected type
  updateExpirationFieldState(sel.value);
  syncEmployeeSsnVerificationFields(sel.value);

  // Bind change listener (idempotent via flag)
  if (!sel.dataset.expBound) {
    sel.dataset.expBound = '1';
    sel.addEventListener('change', () => {
      updateExpirationFieldState(sel.value);
      syncEmployeeSsnVerificationFields(sel.value);
    });
  }
}

function buildChecklistStatusText(applications, documents) {
  const industry = inferPrimaryIndustry(applications);
  const checklist = getChecklistTemplate(industry);

  const docByType = new Map();
  (documents || []).forEach((doc) => {
    if (!docByType.has(doc.documentType)) docByType.set(doc.documentType, []);
    docByType.get(doc.documentType).push(doc);
  });

  const lines = checklist.map((item) => {
    const docs = docByType.get(item.type) || [];
    const hasDoc = docs.length > 0;

    if (!item.required && !hasDoc) {
      return `${item.label}: Optional (not uploaded)`;
    }

    if (!hasDoc) {
      return `${item.label}: Missing`;
    }

    if (item.requiresExpiration) {
      const hasExpiration = docs.some((doc) => Boolean(doc.expirationDate));
      if (!hasExpiration) {
        return `${item.label}: Uploaded but expiration date is missing`;
      }
      const expirationValues = docs
        .map((doc) => doc.expirationDate)
        .filter(Boolean)
        .join(', ');
      return `${item.label}: Complete (expiration: ${expirationValues})`;
    }

    return `${item.label}: Complete`;
  });

  const profileType = HEALTHCARE_INDUSTRIES.has(industry) ? 'Healthcare profile' : 'Warehouse profile';
  return `${profileType} | ${lines.join(' | ')}`;
}

function buildChecklistStatusTextFromCompliance(compliance) {
  if (!compliance || !Array.isArray(compliance.items)) return null;

  const intro = compliance.isComplete
    ? 'Profile Completion: Complete'
    : 'Profile Completion: Incomplete';

  const track = compliance.track === 'healthcare' ? 'Healthcare profile' : 'Warehouse profile';

  const lines = compliance.items.map((item) => {
    const label = DOCUMENT_TYPE_LABELS[item.documentType] || item.documentType;

    if (!item.required && item.uploadedCount === 0) {
      return `${label}: Optional (not uploaded)`;
    }

    if (item.missingRequired) {
      return `${label}: Missing`;
    }

    if (item.missingExpiration) {
      return `${label}: Uploaded but expiration date is missing`;
    }

    return `${label}: Complete`;
  });

  return `${intro} | ${track} | ${lines.join(' | ')}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function refreshPortalTileSummaryForSection(section) {
  if (!section || !section.id) return;
  const summaryEl = document.querySelector(`.portal-widget-tile[data-section-id="${section.id}"] .portal-widget-tile__summary`);
  if (!summaryEl) return;
  summaryEl.textContent = buildPortalTileSummary(section);
}

function refreshPortalTileSummaries() {
  const sections = document.querySelectorAll('.portal-widget-tile[data-section-id]');
  sections.forEach((tile) => {
    const sectionId = tile.dataset.sectionId;
    if (!sectionId) return;
    const section = document.getElementById(sectionId);
    if (!section) return;
    refreshPortalTileSummaryForSection(section);
  });
}

function setTableRows(tbodyId, rowsHtml, colspan, emptyText) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const entryCount = Array.isArray(rowsHtml) ? rowsHtml.length : 0;
  tbody.dataset.entryCount = String(entryCount);

  if (!entryCount) {
    tbody.innerHTML = `<tr data-empty-row="1"><td colspan="${colspan}">${escapeHtml(emptyText)}</td></tr>`;
    refreshPortalTileSummaryForSection(tbody.closest('.portal-section'));
    return;
  }

  tbody.innerHTML = rowsHtml.join('');
  refreshPortalTileSummaryForSection(tbody.closest('.portal-section'));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function bindPhoneMask(input) {
  if (!input || input.dataset.phoneMaskBound === '1') return;

  const applyMask = () => {
    input.value = formatPhoneDisplay(input.value);
  };

  input.addEventListener('input', applyMask);
  input.addEventListener('blur', applyMask);
  applyMask();

  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('maxlength', '14');
  input.dataset.phoneMaskBound = '1';
}

async function lookupCityStateByZip(zipCode) {
  const zipDigits = String(zipCode || '').replace(/\D/g, '');
  if (zipDigits.length < 5) return null;

  const zip5 = zipDigits.slice(0, 5);
  if (ZIP_LOOKUP_CACHE.has(zip5)) {
    return ZIP_LOOKUP_CACHE.get(zip5);
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip5}`);
    if (!response.ok) return null;

    const payload = await response.json().catch(() => null);
    const place = payload && Array.isArray(payload.places) ? payload.places[0] : null;
    if (!place) return null;

    const result = {
      city: String(place['place name'] || '').trim(),
      state: String(place['state abbreviation'] || '').trim().toUpperCase(),
    };

    if (!result.city || !result.state) return null;
    ZIP_LOOKUP_CACHE.set(zip5, result);
    return result;
  } catch (_error) {
    return null;
  }
}

function bindZipAutofill(zipInput, cityInput, stateInput) {
  if (!zipInput || !cityInput || !stateInput || zipInput.dataset.zipAutofillBound === '1') {
    return;
  }

  const applyLookup = async () => {
    const zipDigits = String(zipInput.value || '').replace(/\D/g, '').slice(0, 10);
    zipInput.value = zipDigits;

    if (zipDigits.length < 5) return;

    const result = await lookupCityStateByZip(zipDigits);
    if (!result) return;

    cityInput.value = result.city;
    stateInput.value = result.state;
  };

  zipInput.addEventListener('input', () => {
    zipInput.value = String(zipInput.value || '').replace(/\D/g, '').slice(0, 10);
  });

  zipInput.addEventListener('change', applyLookup);
  zipInput.addEventListener('blur', applyLookup);
  zipInput.dataset.zipAutofillBound = '1';
}

function statusBadge(status) {
  const s = String(status || '').toLowerCase();
  let cls;
  if (s === 'open' || s === 'active' || s === 'assigned' || s === 'complete' || s === 'accepted' || s === 'approved' || s === 'executed') cls = 'badge--green';
  else if (s === 'closed' || s === 'cancelled' || s === 'inactive' || s === 'missing' || s === 'declined' || s === 'no_call_no_show' || s === 'expired') cls = 'badge--red';
  else if (s === 'stat_pay' || s === 'withdrawal_pending' || s === 'renewal_pending') cls = 'badge--yellow';
  else if (s === 'draft' || s === 'pending' || s === 'incomplete' || s === 'registered' || s === 'pending_approval') cls = 'badge--yellow';
  else cls = 'badge--gray';
  const displayLabel = s === 'pending_approval'
    ? 'Pending Approval'
    : s === 'no_call_no_show'
      ? 'No Call No Show'
      : s === 'stat_pay'
        ? 'STAT PAY'
        : s === 'withdrawal_pending'
          ? 'Withdrawal Pending'
          : s === 'renewal_pending'
            ? 'Renewal Pending'
            : status;
  return `<span class="badge ${cls}">${escapeHtml(displayLabel)}</span>`;
}

function statPayApprovalMarkup(item) {
  const enabled = Boolean(item && item.statPayEnabled);
  if (!enabled) return '';
  const signer = String((item && item.statPaySignatureName) || '').trim();
  if (!signer) {
    return `${statusBadge('stat_pay')}<br><span style="font-size:0.78rem;color:var(--color-muted)">Pending client signature</span>`;
  }
  return `${statusBadge('stat_pay')}<br><span style="font-size:0.78rem;color:var(--color-muted)">Signed by ${escapeHtml(signer)}</span>`;
}

function parseShiftStartFromScheduleText(scheduleText) {
  const raw = String(scheduleText || '').trim();
  if (!raw) return null;
  const startPart = raw.split(/\suntil\s/i)[0] || raw;
  const date = new Date(startPart.trim());
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function contractPartyStatus(signatureName, signedAt) {
  if (signatureName && signedAt) {
    return `${escapeHtml(signatureName)}<br><span style="font-size:0.78rem;color:var(--color-muted)">${escapeHtml(formatDateTime(signedAt))}</span>`;
  }
  return '<span class="badge badge--gray">Pending</span>';
}

function populateContractClientSelect(selectId, track) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const currentValue = select.value;
  const options = adminState.users
    .filter((item) => String(item.role || '').toLowerCase() === 'jobsite')
    .filter((item) => {
      if (!track) return true;
      const clientTrack = String(item.industryTrack || '').toLowerCase();
      return !clientTrack || clientTrack === track;
    })
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}${item.email ? ` (${item.email})` : ''}</option>`)
    .join('');
  select.innerHTML = '<option value="">Select client</option>' + options;
  if (currentValue) select.value = currentValue;
}

function renderAdminContractsTable(tbodyId, items) {
  const rows = (items || []).map((item) => `
    <tr>
      <td><a class="link" href="${escapeHtml(item.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(item.originalName || 'Contract')}</a></td>
      <td>${escapeHtml(item.clientCompanyName || item.clientUserName || 'Client')}</td>
      <td>${statusBadge(item.status || 'pending')}</td>
      <td>${contractPartyStatus(item.clientSignatureName, item.clientSignedAt)}</td>
      <td>${contractPartyStatus(item.adminSignatureName, item.adminSignedAt)}</td>
      <td><button class="button button--ghost button--sm" type="button" data-admin-contract-review-id="${escapeHtml(item.id)}">Review</button></td>
    </tr>
  `);
  setTableRows(tbodyId, rows, 6, 'No contracts available.');
}

function renderAdminContractsBankTable(items) {
  const rows = (items || []).map((item) => `
    <tr data-bank-contract-id="${escapeHtml(item.id)}" data-bank-contract-track="${escapeHtml(item.industryTrack || '')}" data-bank-contract-name="${escapeHtml(item.originalName || 'Contract')}">
      <td><a class="link" href="${escapeHtml(item.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(item.originalName || 'Contract')}</a></td>
      <td>${escapeHtml(formatIndustryTrackLabel(item.industryTrack || 'warehouse'))}</td>
      <td>${escapeHtml(formatDateOnly(item.createdAt))}</td>
      <td><button class="button button--ghost" type="button" data-delete-bank-id="${escapeHtml(item.id)}" style="padding:0.2rem 0.65rem;font-size:0.82rem;color:#c0392b;">Delete</button></td>
    </tr>
  `);
  setTableRows('adminContractsBankTbody', rows, 4, 'No contracts in the bank yet.');
}

async function loadAdminContracts(track = '') {
  const suffix = track ? `?industryTrack=${encodeURIComponent(track)}` : '';
  const res = await apiFetch(`/api/admin/contracts${suffix}`);
  if (!res.ok) return [];
  const payload = await res.json().catch(() => ({}));
  return Array.isArray(payload.data) ? payload.data : [];
}

async function loadAdminContractsBank() {
  const res = await apiFetch('/api/admin/contract-bank');
  if (!res.ok) return [];
  const payload = await res.json().catch(() => ({}));
  return Array.isArray(payload.data) ? payload.data : [];
}

async function loadAdminMiscDocs() {
  const res = await apiFetch('/api/admin/misc-docs');
  if (!res.ok) return [];
  const payload = await res.json().catch(() => ({}));
  return Array.isArray(payload.data) ? payload.data : [];
}

async function loadMiscDocRecipients(forceRefresh = false) {
  if (!forceRefresh && adminState.miscSendRecipients) {
    return adminState.miscSendRecipients;
  }

  const buildFallback = () => ({
    employees: (adminState.employees || []).map((e) => ({ id: Number(e.userId || e.id), name: e.name, email: e.email })),
    jobsites: (adminState.users || [])
      .filter((u) => String(u.role || '').toLowerCase() === 'jobsite')
      .map((u) => ({ id: Number(u.id), name: u.name, email: u.email })),
  });

  try {
    const res = await apiFetch('/api/admin/misc-docs/recipients');
    if (!res.ok) {
      const fallback = buildFallback();
      adminState.miscSendRecipients = fallback;
      return fallback;
    }

    const payload = await res.json().catch(() => ({}));
    const result = {
      employees: Array.isArray(payload.employees) ? payload.employees : [],
      jobsites: Array.isArray(payload.jobsites) ? payload.jobsites : [],
    };
    if (!result.employees.length && adminState.employees.length) {
      const fallback = buildFallback();
      adminState.miscSendRecipients = fallback;
      return fallback;
    }
    adminState.miscSendRecipients = result;
    return result;
  } catch (_error) {
    const fallback = buildFallback();
    adminState.miscSendRecipients = fallback;
    return fallback;
  }
}

function renderAdminMiscDocsTable(items) {
  const rows = (items || []).map((item) => `
    <tr>
      <td><a class="link" href="${escapeHtml(item.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(item.originalName || 'Document')}</a></td>
      <td>${escapeHtml(item.description || '\u2014')}</td>
      <td>${escapeHtml(formatDateOnly(item.createdAt))}</td>
      <td><button class="button button--ghost" type="button" data-send-misc-id="${escapeHtml(String(item.id))}" data-send-misc-name="${escapeHtml(item.originalName || 'Document')}" style="padding:0.2rem 0.65rem;font-size:0.82rem;">Send</button></td>
      <td><button class="button button--ghost" type="button" data-delete-misc-id="${escapeHtml(String(item.id))}" style="padding:0.2rem 0.65rem;font-size:0.82rem;color:#c0392b;">Delete</button></td>
    </tr>
  `);
  setTableRows('adminMiscDocsTbody', rows, 5, 'No background forms yet.');
}

  async function loadEmployeeMiscDocs() {
    const res = await apiFetch('/api/portal/employee/misc-docs');
    if (!res.ok) return [];
    const payload = await res.json().catch(() => ({}));
    return Array.isArray(payload.data) ? payload.data : [];
  }

  function renderEmployeeMiscDocs(items) {
    const section = document.getElementById('employeeMiscDocsSection');
    const rows = (items || []).map((item) => `
      <tr>
        <td><a class="link" href="${escapeHtml(item.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(item.originalName || 'Document')}</a></td>
        <td>${escapeHtml(item.description || '\u2014')}</td>
        <td>${escapeHtml(formatDateOnly(item.sentAt))}</td>
      </tr>
    `);
    setTableRows('employeeMiscDocsTbody', rows, 3, 'No documents received yet.');
    if (section) section.hidden = (items || []).length === 0;
  }

  async function loadJobsiteMiscDocs() {
    const res = await apiFetch('/api/portal/jobsite/misc-docs');
    if (!res.ok) return [];
    const payload = await res.json().catch(() => ({}));
    return Array.isArray(payload.data) ? payload.data : [];
  }

  function renderJobsiteMiscDocs(items) {
    const section = document.getElementById('jobsiteMiscDocsSection');
    const rows = (items || []).map((item) => `
      <tr>
        <td><a class="link" href="${escapeHtml(item.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(item.originalName || 'Document')}</a></td>
        <td>${escapeHtml(item.description || '\u2014')}</td>
        <td>${escapeHtml(formatDateOnly(item.sentAt))}</td>
      </tr>
    `);
    setTableRows('jobsiteMiscDocsTbody', rows, 3, 'No documents received yet.');
    if (section) section.hidden = (items || []).length === 0;
  }

function openAdminContractReview(contract) {
  const section = document.getElementById('adminContractReviewSection');
  const meta = document.getElementById('adminContractReviewMeta');
  const link = document.getElementById('adminContractReviewFileLink');
  const signBtn = document.getElementById('adminContractSignBtn');
  const msg = document.getElementById('adminContractReviewMessage');
  const signature = document.getElementById('adminContractSignature');
  const authorize = document.getElementById('adminContractAuthorize');
  const trackSelect = document.getElementById('adminContractIndustryTrack');
  if (!section || !meta || !link || !signBtn || !msg || !signature || !authorize) return;
  hideMessage(msg);
  signature.value = '';
  authorize.checked = false;
  const contractStatus = String(contract.status || 'pending');
  signBtn.dataset.contractId = String(contract.id || '');
  if (trackSelect) trackSelect.value = String(contract.industryTrack || 'warehouse').toLowerCase();
  const trackSaveBtn = document.getElementById('adminContractIndustryTrackSaveBtn');
  if (trackSaveBtn) trackSaveBtn.dataset.contractId = String(contract.id || '');
  link.href = String(contract.fileUrl || '#');
  const trackLabel = String(contract.industryTrack || 'warehouse').toLowerCase() === 'healthcare' ? 'Healthcare' : 'Warehouse';
  let renewalLine = contract.renewalDueAt ? ` | Renewal Due: ${escapeHtml(formatDateOnly(contract.renewalDueAt))}` : '';
  meta.innerHTML = `Client: ${escapeHtml(contract.clientCompanyName || contract.clientUserName || 'Client')} | Track: ${escapeHtml(trackLabel)} | Status: ${statusBadge(contractStatus)} | Client Signed: ${contract.clientSignedAt ? escapeHtml(formatDateTime(contract.clientSignedAt)) : 'No'}${renewalLine}`;

  // Show sign button only when pending and client has signed
  signBtn.style.display = (contractStatus === 'pending' && contract.clientSignedAt && !contract.adminSignedAt) ? '' : 'none';

  // Delete button: only for pending/declined/withdrawn
  const deleteBtn = document.getElementById('adminContractDeleteBtn');
  if (deleteBtn) {
    const canDelete = ['pending', 'declined', 'withdrawn'].includes(contractStatus);
    deleteBtn.style.display = canDelete ? '' : 'none';
    deleteBtn.dataset.contractId = String(contract.id || '');
  }

  // Cancellation confirm panel: only for withdrawal_pending
  const cancelPanel = document.getElementById('adminContractCancelPanel');
  const cancelConfirmBtn = document.getElementById('adminContractCancelConfirmBtn');
  const cancelMsg2 = document.getElementById('adminContractCancelMessage');
  if (cancelPanel) {
    cancelPanel.style.display = contractStatus === 'withdrawal_pending' ? '' : 'none';
    if (cancelConfirmBtn) cancelConfirmBtn.dataset.contractId = String(contract.id || '');
    const cancelSig = document.getElementById('adminContractCancelSignature');
    if (cancelSig) cancelSig.value = '';
    if (cancelMsg2) hideMessage(cancelMsg2);
    if (contractStatus === 'withdrawal_pending' && contract.clientWithdrawalSignatureName) {
      const note = document.createElement('p');
      note.style.cssText = 'font-size:0.88rem;color:var(--color-muted);margin:0 0 0.6rem;';
      note.textContent = `Client signed for cancellation as "${contract.clientWithdrawalSignatureName}" on ${formatDateTime(contract.clientWithdrawalSignedAt)}. Reason: ${contract.withdrawnReason || 'Not provided.'}`;
      cancelPanel.insertBefore(note, cancelPanel.querySelector('.form-row'));
    }
  }

  // Renewal decision panel: for renewal_pending or executed with renewalNotifiedAt
  const renewalPanel = document.getElementById('adminContractRenewalPanel');
  const renewBtn2 = document.getElementById('adminContractRenewBtn');
  const denyBtn2 = document.getElementById('adminContractDenyRenewalBtn');
  const renewalPanel2Msg = document.getElementById('adminContractRenewalMessage');
  const clientStatusDiv = document.getElementById('adminContractRenewalClientStatus');
  if (renewalPanel) {
    const showRenewal = ['renewal_pending', 'executed'].includes(contractStatus) && contract.renewalNotifiedAt;
    renewalPanel.style.display = showRenewal ? '' : 'none';
    if (renewBtn2) renewBtn2.dataset.contractId = String(contract.id || '');
    if (denyBtn2) denyBtn2.dataset.contractId = String(contract.id || '');
    if (renewalPanel2Msg) hideMessage(renewalPanel2Msg);
    const adminSigRow = document.getElementById('adminRenewalSignatureRow');
    if (adminSigRow) adminSigRow.style.display = 'none';
    const adminSig = document.getElementById('adminContractRenewalSignature');
    if (adminSig) adminSig.value = '';
    if (clientStatusDiv) {
      const cd = contract.renewalClientDecision;
      clientStatusDiv.textContent = cd
        ? `Client decision: ${cd.charAt(0).toUpperCase() + cd.slice(1)}${cd === 'renew' && contract.clientRenewalSignatureName ? ` (signed: ${contract.clientRenewalSignatureName})` : ''}`
        : 'Client has not yet submitted their renewal decision.';
    }
  }

  section.hidden = false;
  openPortalDrawerById('adminContractReviewSection');
}

function renderJobsiteContracts(data) {
  const rows = (data || []).map((item) => `
    <tr>
      <td>
        <a class="link" href="${escapeHtml(item.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(item.originalName || 'Contract')}</a>
        <br><span style="font-size:0.78rem;color:var(--color-muted)">${escapeHtml(item.clientCompanyName || item.clientContactName || item.clientUserName || 'Facility')}</span>
      </td>
      <td>${statusBadge(item.status || 'pending')}</td>
      <td>${item.clientOpenedAt ? escapeHtml(formatDateTime(item.clientOpenedAt)) : '<span class="badge badge--gray">Not Opened</span>'}</td>
      <td>${contractPartyStatus(item.clientSignatureName, item.clientSignedAt)}</td>
      <td>${contractPartyStatus(item.adminSignatureName, item.adminSignedAt)}</td>
      <td><button class="button button--ghost button--sm" type="button" data-jobsite-contract-review-id="${escapeHtml(item.id)}">Review</button></td>
    </tr>
  `);
  setTableRows('jobsiteContractsTbody', rows, 6, 'No contracts available.');
}

async function loadJobsiteContracts() {
  const tbody = document.getElementById('jobsiteContractsTbody');
  if (!tbody) return;
  const res = await apiFetch('/api/portal/jobsite/contracts');
  if (!res.ok) {
    setTableRows('jobsiteContractsTbody', [], 6, 'Unable to load contracts right now.');
    return;
  }
  const payload = await res.json().catch(() => ({}));
  renderJobsiteContracts(Array.isArray(payload.data) ? payload.data : []);
}

async function apiFetch(url, options = {}) {
  const token = options._omitStoredToken ? null : getToken();
  const headers = Object.assign({}, options.headers || {});

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resolvedUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${API_BASE_URL}${url}`;

  const res = await fetch(resolvedUrl, {
    method: options.method || 'GET',
    headers,
    credentials: 'same-origin',
    body: options.body,
  });

  if (res.status === 401 && !options._skipAuthRedirect) {
    clearToken();
    window.location.href = buildPortalLoginRedirectPath(getCurrentPortalRelativeUrl(), { reason: 'session_expired' });
    // Return a never-resolving promise so callers don't run their error path
    return new Promise(() => {});
  }

  return res;
}

function routeForRole(role, portalScope = 'full') {
  const normalizedScope = String(portalScope || '').trim().toLowerCase();
  if (IS_FILE_PROTOCOL) {
    if (role === 'employee') return 'portal-employee.html';
    if (role === 'jobsite') return 'portal-jobsite.html';
    if (role === 'admin') {
      if (normalizedScope === 'onboarding') return 'portal-onboarding.html';
      if (normalizedScope === 'contracts') return 'portal-contracts.html';
      if (normalizedScope === 'scheduling') return 'portal-scheduling.html';
      return 'portal-admin.html';
    }
    return 'portal-login.html';
  }

  if (role === 'employee') return '/portal-employee';
  if (role === 'jobsite') return '/portal-jobsite';
  if (role === 'admin') {
    if (normalizedScope === 'onboarding') return '/portal-onboarding';
    if (normalizedScope === 'contracts') return '/portal-contracts';
    if (normalizedScope === 'scheduling') return '/portal-scheduling';
    return '/portal-admin';
  }
  return '/portal-login';
}

function redirectToUserHome(user, context, details = {}) {
  const targetPath = user && user.homePath ? user.homePath : routeForRole(user && user.role, user && user.portalScope);
  const currentUrl = new URL(window.location.href);
  const targetUrl = new URL(targetPath, window.location.origin);

  if (currentUrl.pathname === targetUrl.pathname && currentUrl.search === targetUrl.search) {
    console.warn('[portal-loop-guard] prevented self-redirect', {
      context,
      currentPath: `${currentUrl.pathname}${currentUrl.search}`,
      targetPath: `${targetUrl.pathname}${targetUrl.search}`,
      ...details,
    });
    return false;
  }

  console.warn('[portal-redirect] redirecting to user home', {
    context,
    currentPath: `${currentUrl.pathname}${currentUrl.search}`,
    targetPath: `${targetUrl.pathname}${targetUrl.search}`,
    ...details,
  });
  window.location.href = targetUrl.toString();
  return true;
}

function parsePortalDateTime(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  let text = String(value).trim();
  if (!text) return null;

  // SQLite CURRENT_TIMESTAMP is UTC but omits timezone ("YYYY-MM-DD HH:MM:SS").
  // Normalize to ISO UTC for consistent parsing across browsers/devices.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)) {
    text = `${text.replace(' ', 'T')}Z`;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalDateYmd(value) {
  const date = parsePortalDateTime(value);
  if (!date) return String(value || '').slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateOnly(value) {
  if (!value) return '—';

  const ymdMatch = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  }

  const date = parsePortalDateTime(value);
  if (!date) return String(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatDateRange(startValue, endValue) {
  const startText = startValue ? formatDateOnly(startValue) : '—';
  const endText = endValue ? formatDateOnly(endValue) : '—';
  return `${startText} – ${endText}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = parsePortalDateTime(value);
  if (!date) return String(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const timeText = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dd}/${mm}/${yyyy} ${timeText}`;
}

function parseUsTimeTo24(value) {
  const text = String(value || '').trim();
  if (!text) return null;

  // Accept 24h input as fallback: HH:mm
  const m24 = text.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = Number(m24[1]);
    const m = Number(m24[2]);
    if (Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  // Accept compact 24h military input: HMM or HHMM (e.g. 600, 1800)
  const compact24 = text.match(/^(\d{3,4})$/);
  if (compact24) {
    const digits = compact24[1];
    const hPart = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
    const mPart = digits.slice(-2);
    const h = Number(hPart);
    const m = Number(mPart);
    if (Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  // Preferred US format: h:mm AM/PM
  const m12 = text.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (m12) {
    let h = Number(m12[1]);
    const m = Number(m12[2]);
    const period = m12[3].toUpperCase();
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 1 || h > 12 || m < 0 || m > 59) return null;

    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Accept compact 12h inputs like 740pm / 0740PM / 740p
  const compact12 = text.match(/^(\d{3,4})\s*([AaPp])(?:[Mm])?$/);
  if (!compact12) return null;

  const digits = compact12[1];
  const periodChar = compact12[2].toUpperCase();
  const hPart = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
  const mPart = digits.slice(-2);
  let h = Number(hPart);
  const m = Number(mPart);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 1 || h > 12 || m < 0 || m > 59) return null;

  if (periodChar === 'A') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function format24ToUsTime(value) {
  const normalized = parseUsTimeTo24(value);
  if (!normalized) return '';
  const [hText, mText] = normalized.split(':');
  const h = Number(hText);
  const m = Number(mText);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function normalizeTimeInputDisplay(inputEl) {
  if (!inputEl) return;
  const raw = String(inputEl.value || '').trim();
  if (!raw) return;
  const formatted = format24ToUsTime(raw);
  if (formatted) inputEl.value = formatted;
}

function getCurrentDeviceCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position && position.coords ? position.coords.latitude : NaN);
        const longitude = Number(position && position.coords ? position.coords.longitude : NaN);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject(new Error('Unable to determine your location.'));
          return;
        }

        resolve({ latitude, longitude });
      },
      (error) => {
        if (error && error.code === error.PERMISSION_DENIED) {
          reject(new Error('Location access is required to clock in/out at your assigned site.'));
          return;
        }
        reject(new Error('Unable to capture location. Please try again.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

function populateAccountIdentityFields(user, options = {}) {
  const nameFieldId = options.nameFieldId || 'portalAccountName';
  const userIdFieldId = options.userIdFieldId || 'portalAccountUserId';
  const emailFieldId = options.emailFieldId || 'portalAccountEmail';
  const passwordStatusFieldId = options.passwordStatusFieldId || 'portalAccountPasswordStatus';
  const pendingEmailNoticeId = options.pendingEmailNoticeId || 'portalAccountPendingEmailNotice';
  const profile = options.profile || {};

  const nameField = document.getElementById(nameFieldId);
  if (nameField) {
    nameField.value = String(user && user.name ? user.name : '').trim();
  }

  const userIdField = document.getElementById(userIdFieldId);
  if (userIdField) {
    const userId = user && user.id !== undefined && user.id !== null ? String(user.id) : '';
    userIdField.value = userId;
  }

  const emailField = document.getElementById(emailFieldId);
  if (emailField) {
    emailField.value = String(user && user.email ? user.email : '').trim();
  }

  const pendingEmailNotice = document.getElementById(pendingEmailNoticeId);
  if (pendingEmailNotice) {
    const pendingEmail = String(user && user.pendingEmail ? user.pendingEmail : '').trim();
    if (pendingEmail) {
      pendingEmailNotice.hidden = false;
      pendingEmailNotice.textContent = t('account.pendingEmailNotice', { email: pendingEmail });
    } else {
      pendingEmailNotice.hidden = true;
      pendingEmailNotice.textContent = '';
    }
  }

  const passwordStatusField = document.getElementById(passwordStatusFieldId);
  if (passwordStatusField) {
    passwordStatusField.value = 'Hidden for security';
  }

  const accountPhone = document.getElementById(options.phoneFieldId || 'portalAccountPhone');
  if (accountPhone) accountPhone.value = formatPhoneForView(profile.phone || '', '');

  const accountAddress = document.getElementById(options.addressFieldId || 'portalAccountAddress');
  if (accountAddress) accountAddress.value = String(profile.address || '').trim();

  const accountCity = document.getElementById(options.cityFieldId || 'portalAccountCity');
  if (accountCity) accountCity.value = String(profile.city || '').trim();

  const accountState = document.getElementById(options.stateFieldId || 'portalAccountState');
  if (accountState) accountState.value = String(profile.state || '').trim();

  const accountZip = document.getElementById(options.zipFieldId || 'portalAccountZip');
  if (accountZip) accountZip.value = String(profile.zip || '').trim();

  const accountSkills = document.getElementById(options.skillsFieldId || 'portalAccountSkills');
  if (accountSkills) accountSkills.value = String(profile.skills || '').trim();

  const accountCertifications = document.getElementById(options.certificationsFieldId || 'portalAccountCertifications');
  if (accountCertifications) accountCertifications.value = String(profile.certifications || '').trim();

  const accountCompanyName = document.getElementById(options.companyNameFieldId || 'portalAccountCompanyName');
  if (accountCompanyName) accountCompanyName.value = String(profile.companyName || '').trim();

  const accountContactName = document.getElementById(options.contactNameFieldId || 'portalAccountContactName');
  if (accountContactName) accountContactName.value = String(profile.contactName || '').trim();

  const notifyEmailField = document.getElementById(options.notifyEmailFieldId || 'portalNotifyEmailEnabled');
  const notifySmsField = document.getElementById(options.notifySmsFieldId || 'portalNotifySmsEnabled');
  const notifyPushField = document.getElementById(options.notifyPushFieldId || 'portalNotifyPushEnabled');
  const prefs = (user && user.notificationPreferences) || { email: true, sms: true, push: true };

  if (notifyEmailField) {
    const enabled = prefs.email !== false;
    notifyEmailField.checked = enabled;
    notifyEmailField.dataset.initialValue = enabled ? '1' : '0';
  }
  if (notifySmsField) {
    const enabled = prefs.sms !== false;
    notifySmsField.checked = enabled;
    notifySmsField.dataset.initialValue = enabled ? '1' : '0';
  }
  if (notifyPushField) {
    const enabled = prefs.push !== false;
    notifyPushField.checked = enabled;
    notifyPushField.dataset.initialValue = enabled ? '1' : '0';
    if (user && user.mandatoryPushLock) {
      notifyPushField.checked = true;
      notifyPushField.disabled = true;
      notifyPushField.title = String(user.mandatoryPushLockReason || 'Push notifications are required for this account.');
    } else {
      notifyPushField.disabled = false;
      notifyPushField.removeAttribute('title');
    }
  }

  const languageField = document.getElementById('portalLanguageSelect');
  if (languageField) {
    languageField.value = String(user && user.preferredLanguage ? user.preferredLanguage : portalLanguage || PORTAL_DEFAULT_LANGUAGE);
  }

  bindNotificationPreferenceAutoSave();
}

function promptForCredential(actionLabel) {
  return window.prompt(`Enter your password or 4-digit passcode to ${actionLabel}:`);
}

function bindNotificationPreferenceAutoSave() {
  const notifyEmailField = document.getElementById('portalNotifyEmailEnabled');
  const notifySmsField = document.getElementById('portalNotifySmsEnabled');
  const notifyPushField = document.getElementById('portalNotifyPushEnabled');

  [notifyEmailField, notifySmsField, notifyPushField].filter(Boolean).forEach((el) => {
    if (el.dataset.prefBound === '1') return;
    el.dataset.prefBound = '1';
    el.addEventListener('change', async () => {
      try {
        await apiFetch('/api/account/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notifyEmailEnabled: notifyEmailField ? notifyEmailField.checked : true,
            notifySmsEnabled:   notifySmsField   ? notifySmsField.checked   : true,
            notifyPushEnabled:  notifyPushField  ? notifyPushField.checked  : true,
          }),
        });
      } catch (_) {}
    });
  });
}

function bindPortalLanguageSelector() {
  const selector = document.getElementById('portalLanguageSelect');
  if (!selector) return;
  if (!isEmployeePortalPage()) {
    const label = selector.closest('.portal-language-picker');
    if (label) {
      label.hidden = true;
    } else {
      selector.hidden = true;
    }
    return;
  }
  if (selector.dataset.bound === '1') return;

  selector.dataset.bound = '1';
  selector.value = portalLanguage;

  selector.addEventListener('change', async () => {
    const nextLanguage = PORTAL_LANGUAGE_LABELS[selector.value] ? selector.value : PORTAL_DEFAULT_LANGUAGE;
    setPortalDocumentLanguage(nextLanguage);
    applyPortalStaticTranslations();

    try {
      await apiFetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: nextLanguage }),
      });
    } catch (_error) {
      // Keep the local choice for the current session even if persistence fails.
    }

    window.location.reload();
  });
}

function resolveCredential(actionLabel, messageElement) {
  const credential = promptForCredential(actionLabel);
  if (credential === null) return null;
  if (!String(credential).trim()) {
    setMessage(messageElement, 'Password or 4-digit passcode is required.', 'error');
    return '';
  }
  return String(credential);
}

function clearUrlParams(paramNames) {
  const nextUrl = new URL(window.location.href);
  let changed = false;

  paramNames.forEach((name) => {
    if (nextUrl.searchParams.has(name)) {
      nextUrl.searchParams.delete(name);
      changed = true;
    }
  });

  if (changed) {
    window.history.replaceState({}, '', nextUrl.toString());
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function uint8ArrayToUrlBase64(bytes) {
  if (!bytes || typeof bytes.length !== 'number') return '';
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function supportsPasskeys() {
  return Boolean(window.PublicKeyCredential && navigator.credentials && typeof navigator.credentials.create === 'function' && typeof navigator.credentials.get === 'function');
}

function currentUserRequiresSensitiveBiometric() {
  return Boolean(
    portalCurrentUser
    && portalCurrentUser.securityPreferences
    && portalCurrentUser.securityPreferences.requireBiometricSensitive === true
  );
}

async function requestSensitiveActionPasskeyProof(action, messageElement) {
  if (!currentUserRequiresSensitiveBiometric()) {
    return '';
  }

  if (!supportsPasskeys()) {
    return '';
  }

  try {
    const optionsRes = await apiFetch('/api/auth/passkey/action/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const optionsPayload = await optionsRes.json().catch(() => ({}));
    if (!optionsRes.ok || !optionsPayload.options || !optionsPayload.challengeId) {
      setMessage(messageElement, optionsPayload.error || 'Unable to start biometric confirmation.', 'error');
      return null;
    }

    const publicKey = decodePasskeyAuthenticationOptions(optionsPayload.options);
    const assertion = await navigator.credentials.get({ publicKey });
    if (!assertion) {
      setMessage(messageElement, 'Biometric confirmation was cancelled.', 'neutral');
      return null;
    }

    const verifyRes = await apiFetch('/api/auth/passkey/action/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        challengeId: optionsPayload.challengeId,
        response: buildPasskeyAuthenticationPayload(assertion),
      }),
    });
    const verifyPayload = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok || !verifyPayload.proofToken) {
      setMessage(messageElement, verifyPayload.error || 'Biometric confirmation failed.', 'error');
      return null;
    }

    return String(verifyPayload.proofToken);
  } catch (error) {
    if (error && error.name === 'NotAllowedError') {
      setMessage(messageElement, 'Biometric confirmation was cancelled.', 'neutral');
    } else {
      setMessage(messageElement, 'Biometric confirmation failed. Please try again.', 'error');
    }
    return null;
  }
}

async function resolveSensitiveActionAuthorization(action, messageElement, promptLabel) {
  if (!currentUserRequiresSensitiveBiometric()) {
    return { passkeyProof: '', currentCredential: '' };
  }

  if (supportsPasskeys()) {
    const passkeyProof = await requestSensitiveActionPasskeyProof(action, messageElement);
    if (passkeyProof) {
      return { passkeyProof, currentCredential: '' };
    }
  }

  const prompted = window.prompt(promptLabel || 'Enter your admin password or 4-digit passcode to confirm this sensitive action:');
  if (prompted === null) {
    return null;
  }

  const currentCredential = String(prompted || '').trim();
  if (!currentCredential) {
    setMessage(messageElement, 'Admin password or passcode is required for this sensitive action.', 'error');
    return null;
  }

  return { passkeyProof: '', currentCredential };
}

function decodePasskeyRegistrationOptions(options) {
  if (!options || typeof options !== 'object') return null;
  const decoded = Object.assign({}, options);
  decoded.challenge = urlBase64ToUint8Array(String(options.challenge || ''));
  decoded.user = Object.assign({}, options.user || {});
  decoded.user.id = urlBase64ToUint8Array(String(options.user && options.user.id ? options.user.id : ''));
  decoded.excludeCredentials = Array.isArray(options.excludeCredentials)
    ? options.excludeCredentials.map((cred) => Object.assign({}, cred, { id: urlBase64ToUint8Array(String(cred && cred.id ? cred.id : '')) }))
    : [];
  return decoded;
}

function decodePasskeyAuthenticationOptions(options) {
  if (!options || typeof options !== 'object') return null;
  const decoded = Object.assign({}, options);
  decoded.challenge = urlBase64ToUint8Array(String(options.challenge || ''));
  decoded.allowCredentials = Array.isArray(options.allowCredentials)
    ? options.allowCredentials.map((cred) => Object.assign({}, cred, { id: urlBase64ToUint8Array(String(cred && cred.id ? cred.id : '')) }))
    : [];
  return decoded;
}

function buildPasskeyRegistrationPayload(credential) {
  if (!credential) return null;
  const response = credential.response || {};
  return {
    id: credential.id,
    rawId: uint8ArrayToUrlBase64(new Uint8Array(credential.rawId || [])),
    type: credential.type,
    response: {
      attestationObject: uint8ArrayToUrlBase64(new Uint8Array(response.attestationObject || [])),
      clientDataJSON: uint8ArrayToUrlBase64(new Uint8Array(response.clientDataJSON || [])),
      transports: typeof response.getTransports === 'function' ? response.getTransports() : [],
    },
    authenticatorAttachment: credential.authenticatorAttachment || null,
    clientExtensionResults: typeof credential.getClientExtensionResults === 'function' ? credential.getClientExtensionResults() : {},
  };
}

function buildPasskeyAuthenticationPayload(credential) {
  if (!credential) return null;
  const response = credential.response || {};
  return {
    id: credential.id,
    rawId: uint8ArrayToUrlBase64(new Uint8Array(credential.rawId || [])),
    type: credential.type,
    response: {
      authenticatorData: uint8ArrayToUrlBase64(new Uint8Array(response.authenticatorData || [])),
      clientDataJSON: uint8ArrayToUrlBase64(new Uint8Array(response.clientDataJSON || [])),
      signature: uint8ArrayToUrlBase64(new Uint8Array(response.signature || [])),
      userHandle: response.userHandle ? uint8ArrayToUrlBase64(new Uint8Array(response.userHandle)) : null,
    },
    authenticatorAttachment: credential.authenticatorAttachment || null,
    clientExtensionResults: typeof credential.getClientExtensionResults === 'function' ? credential.getClientExtensionResults() : {},
  };
}

async function refreshPasskeyStatus(form) {
  if (!form) return;
  const statusEl = form.querySelector('[data-passkey-status]');
  const enrollBtn = form.querySelector('[data-passkey-enroll-btn]');
  const listEl = form.querySelector('[data-passkey-list]');
  const sensitiveToggle = form.querySelector('[name="requireBiometricSensitive"]');
  if (!statusEl) return;

  if (!supportsPasskeys()) {
    statusEl.textContent = 'Biometric passkeys are not supported on this browser/device.';
    if (enrollBtn) enrollBtn.disabled = true;
    return;
  }

  const res = await apiFetch('/api/account/passkeys');
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    statusEl.textContent = payload.error || 'Unable to load biometric status.';
    return;
  }

  const count = Number(payload.count || 0);
  statusEl.textContent = count > 0
    ? `Biometric passkeys enabled: ${count}`
    : 'No biometric passkeys registered yet.';

  if (sensitiveToggle && sensitiveToggle.dataset.initialized !== '1') {
    const enabled = currentUserRequiresSensitiveBiometric();
    sensitiveToggle.checked = enabled;
    sensitiveToggle.dataset.initialValue = enabled ? '1' : '0';
    sensitiveToggle.dataset.initialized = '1';
  }

  if (listEl) {
    const passkeys = Array.isArray(payload.passkeys) ? payload.passkeys : [];
    if (!passkeys.length) {
      listEl.innerHTML = '<li class="disclaimer">No registered passkeys yet.</li>';
    } else {
      listEl.innerHTML = passkeys.map((item) => {
        const created = item.createdAt ? formatDateTime(item.createdAt) : 'Unknown date';
        const lastUsed = item.lastUsedAt ? formatDateTime(item.lastUsedAt) : 'Never';
        return `
          <li class="portal-passkey-item">
            <span>${escapeHtml(item.deviceType || 'Passkey')} • Added ${escapeHtml(created)} • Last used ${escapeHtml(lastUsed)}</span>
            <button class="button button--ghost button--sm" type="button" data-passkey-remove-id="${escapeHtml(item.credentialId || '')}">Remove</button>
          </li>
        `;
      }).join('');
    }
  }
}

async function handlePasskeyEnrollClick(form) {
  const msg = form ? form.querySelector('.form-message') : null;
  const statusEl = form ? form.querySelector('[data-passkey-status]') : null;
  const enrollBtn = form ? form.querySelector('[data-passkey-enroll-btn]') : null;
  if (!form || !enrollBtn) return;

  function showEnrollMessage(text, type) {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = type === 'error' ? 'disclaimer form-message--error' : type === 'success' ? 'disclaimer form-message--success' : 'disclaimer';
    }
    setMessage(msg, text, type);
  }

  if (!supportsPasskeys()) {
    showEnrollMessage('Biometric passkeys are not supported on this browser/device.', 'error');
    return;
  }

  if (window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
    if (!available) {
      showEnrollMessage('No biometric sensor found on this device. Please use a device with Face ID, Touch ID, or fingerprint.', 'error');
      return;
    }
  }

  enrollBtn.disabled = true;
  if (statusEl) statusEl.textContent = 'Starting biometric setup...';
  try {
    const optionsRes = await apiFetch('/api/auth/passkey/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const optionsPayload = await optionsRes.json().catch(() => ({}));
    if (!optionsRes.ok || !optionsPayload.options) {
      showEnrollMessage(optionsPayload.error || 'Unable to start biometric setup.', 'error');
      return;
    }

    const publicKey = decodePasskeyRegistrationOptions(optionsPayload.options);
    if (statusEl) statusEl.textContent = 'Follow the prompt to register your biometric...';
    const credential = await navigator.credentials.create({ publicKey });
    if (!credential) {
      showEnrollMessage('Biometric setup was cancelled.', 'neutral');
      return;
    }

    if (statusEl) statusEl.textContent = 'Verifying biometric registration...';
    const verifyRes = await apiFetch('/api/auth/passkey/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: buildPasskeyRegistrationPayload(credential) }),
    });
    const verifyPayload = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) {
      showEnrollMessage(verifyPayload.error || 'Unable to complete biometric setup.', 'error');
      return;
    }

    showEnrollMessage('Biometric login is now enabled on this device.', 'success');
    await refreshPasskeyStatus(form);
  } catch (error) {
    if (error && error.name === 'NotAllowedError') {
      showEnrollMessage('Biometric setup was cancelled or denied. Please try again and approve the prompt.', 'neutral');
    } else if (error && error.name === 'InvalidStateError') {
      showEnrollMessage('This device is already registered for biometrics.', 'neutral');
    } else {
      showEnrollMessage('Biometric setup failed. Make sure you are on a secure connection (HTTPS) and try again.', 'error');
    }
  } finally {
    enrollBtn.disabled = false;
  }
}

function bindPasskeyAccountControls(form) {
  if (!form || form.dataset.passkeyBound === '1') return;

  const actions = form.querySelector('.form-actions');
  if (!actions) return;

  const row = document.createElement('div');
  row.className = 'form-row portal-passkey-row';
  row.innerHTML = `
    <label>Biometric Login (Passkey)</label>
    <div class="portal-passkey-controls">
      <button class="button button--ghost button--sm" type="button" data-passkey-enroll-btn>Enable Biometrics On This Device</button>
      <p class="disclaimer" data-passkey-status>Checking biometric status...</p>
      <div class="form-row admin-checkbox-row portal-passkey-lock-row">
        <input id="portalRequireBiometricSensitive" name="requireBiometricSensitive" type="checkbox" class="admin-checkbox" />
        <label for="portalRequireBiometricSensitive" class="admin-label-reset">Require biometrics for sensitive admin actions</label>
      </div>
      <ul class="portal-passkey-list" data-passkey-list></ul>
    </div>
  `;
  form.insertBefore(row, actions);
  form.dataset.passkeyBound = '1';

  const enrollBtn = row.querySelector('[data-passkey-enroll-btn]');
  if (enrollBtn) {
    enrollBtn.addEventListener('click', () => {
      handlePasskeyEnrollClick(form);
    });
  }

  row.addEventListener('click', async (event) => {
    const removeBtn = event.target.closest('[data-passkey-remove-id]');
    if (!removeBtn) return;
    const credentialId = String(removeBtn.dataset.passkeyRemoveId || '').trim();
    if (!credentialId) return;

    const confirmed = window.confirm('Remove this biometric passkey from your account?');
    if (!confirmed) return;

    removeBtn.disabled = true;
    const msg = form.querySelector('.form-message');
    try {
      const res = await apiFetch(`/api/account/passkeys/${encodeURIComponent(credentialId)}`, {
        method: 'DELETE',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(msg, payload.error || 'Failed to remove passkey.', 'error');
        return;
      }
      setMessage(msg, 'Passkey removed successfully.', 'success');
      await refreshPasskeyStatus(form);
    } finally {
      removeBtn.disabled = false;
    }
  });

  refreshPasskeyStatus(form).catch(() => {
    const statusEl = form.querySelector('[data-passkey-status]');
    if (statusEl) {
      statusEl.textContent = 'Unable to check biometric status right now.';
    }
  });
}

async function handlePasskeyLoginClick(form) {
  const msg = document.getElementById('portalLoginMessage');
  const email = form && form.email ? String(form.email.value || '').trim().toLowerCase() : '';
  const btn = form ? form.querySelector('[data-passkey-login-btn]') : null;

  if (!supportsPasskeys()) {
    setMessage(msg, 'Biometric sign in is not supported on this browser/device.', 'error');
    return;
  }

  if (!email) {
    setMessage(msg, 'Enter your email first, then use biometric sign in.', 'error');
    return;
  }

  hideMessage(msg);
  if (btn) btn.disabled = true;
  if (msg) msg.textContent = 'Starting biometric sign in...';

  try {
    const optionsRes = await apiFetch('/api/auth/passkey/login/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      _skipAuthRedirect: true,
    });
    const optionsPayload = await optionsRes.json().catch(() => ({}));
    if (!optionsRes.ok || !optionsPayload.options) {
      setMessage(msg, optionsPayload.error || 'Unable to start biometric sign in.', 'error');
      return;
    }

    const publicKey = decodePasskeyAuthenticationOptions(optionsPayload.options);
    if (msg) msg.textContent = 'Follow the biometric prompt on your device...';
    const assertion = await navigator.credentials.get({ publicKey });
    if (!assertion) {
      setMessage(msg, 'Biometric sign in was cancelled.', 'neutral');
      return;
    }

    if (msg) msg.textContent = 'Verifying biometric...';
    const verifyRes = await apiFetch('/api/auth/passkey/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, response: buildPasskeyAuthenticationPayload(assertion) }),
      _skipAuthRedirect: true,
    });
    const verifyPayload = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) {
      setMessage(msg, verifyPayload.error || 'Biometric sign in failed.', 'error');
      return;
    }

    saveToken(verifyPayload.token);
    window.location.href = verifyPayload && verifyPayload.user && verifyPayload.user.homePath
      ? verifyPayload.user.homePath
      : routeForRole(verifyPayload.user.role, verifyPayload.user.portalScope);
  } catch (error) {
    if (error && error.name === 'NotAllowedError') {
      setMessage(msg, 'Biometric sign in was cancelled or denied. Please try again and approve the prompt.', 'neutral');
    } else if (error && error.name === 'SecurityError') {
      setMessage(msg, 'Biometric sign in requires a secure (HTTPS) connection.', 'error');
    } else {
      setMessage(msg, 'Biometric sign in failed. Please try again.', 'error');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function bindPasskeyLoginButton(form) {
  if (!form || form.dataset.passkeyLoginBound === '1') return;

  const actions = form.querySelector('.form-actions');
  if (!actions) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'button button--ghost';
  btn.textContent = 'Sign In with Biometrics';
  btn.setAttribute('data-passkey-login-btn', '1');
  actions.insertBefore(btn, actions.firstChild || null);

  btn.addEventListener('click', () => {
    handlePasskeyLoginClick(form);
  });

  form.dataset.passkeyLoginBound = '1';
}

async function registerPortalServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/service-worker.js');
  } catch (_error) {
    return null;
  }
}

function renderPortalMessages(payload) {
  const contacts = Array.isArray(payload.contacts) ? payload.contacts : [];
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const recipientSelect = document.getElementById('portalMessageRecipient');
  const pageType = document.body?.dataset?.portalPage || '';
  const showAllEmployeesOption = pageType === 'admin';
  const showAllClientsOption = pageType === 'admin';

  if (recipientSelect) {
    const currentValue = recipientSelect.value;
    const allEmployeesOption = showAllEmployeesOption
      ? '<option value="all-employees">All Employees</option>'
      : '';
    const allClientsOption = showAllClientsOption
      ? '<option value="all-clients">All Clients</option>'
      : '';
    recipientSelect.innerHTML = '<option value="">Select recipient</option>' + allEmployeesOption + allClientsOption + contacts
      .map((contact) => `<option value="${escapeHtml(contact.id)}">${escapeHtml(`${contact.name} (${contact.role})`)}</option>`)
      .join('');
    if (currentValue) recipientSelect.value = currentValue;
  }

  const list = document.getElementById('portalMessagesList');
  if (!list) return;
  setPortalMessageSyncStatus('');

  let threads = null;
  let threadItems = [];
  try {
    threads = ensurePortalMessageThreadsContainer(list);
    threadItems = buildPortalMessageThreads(messages, contacts);
  } catch (_error) {
    // Fallback to direct timeline if thread container creation fails.
    threadItems = [];
  }

  if (threads && !threadItems.length) {
    threads.style.display = 'none';
    threads.innerHTML = '<div class="portal-chat-threads__empty">No recipients yet.</div>';
  } else if (threads) {
    threads.style.display = '';
  }

  if (threadItems.length) {
    const selectedFromDropdown = recipientSelect ? asInt(recipientSelect.value) : NaN;
    const selectedStillVisible = Number.isInteger(portalSelectedThreadUserId) && portalSelectedThreadUserId > 0
      && threadItems.some((thread) => thread.userId === portalSelectedThreadUserId);
    if (portalSelectedThreadUserId === -1) {
      // User explicitly closed the thread; keep chat pane closed until a new recipient is selected.
    } else if (!selectedStillVisible) {
      if (Number.isInteger(selectedFromDropdown) && threadItems.some((thread) => thread.userId === selectedFromDropdown)) {
        portalSelectedThreadUserId = selectedFromDropdown;
      } else {
        portalSelectedThreadUserId = threadItems[0].userId;
      }
    }
  }

  if (threads && threadItems.length) {
    threads.innerHTML = threadItems.map((thread) => `
      <button class="portal-chat-threads__item ${thread.userId === portalSelectedThreadUserId ? 'is-active' : ''}" type="button" data-thread-user-id="${escapeHtml(thread.userId)}">
        <span class="portal-chat-threads__name">${escapeHtml(thread.name)}</span>
        <span class="portal-chat-threads__preview">${escapeHtml(thread.preview)}</span>
      </button>
    `).join('');
  }

  let selectedMessages = messages;
  let selectedThread = null;
  if (threadItems.length) {
    selectedThread = threadItems.find((thread) => thread.userId === portalSelectedThreadUserId) || null;
    if (selectedThread) {
      selectedMessages = messages.filter((message) => {
        const bubble = renderPortalMessageBubble(message);
        return Number(bubble.replyUserId) === Number(selectedThread.userId);
      });
    } else {
      selectedMessages = [];
    }
  }

  if (recipientSelect && selectedThread && selectedThread.userId) {
    const selectedValue = String(selectedThread.userId);
    if (Array.from(recipientSelect.options).some((item) => item.value === selectedValue)) {
      recipientSelect.value = selectedValue;
    }
  }

  if (!selectedThread) {
    selectedMessages = messages;
  }

  if (!selectedMessages.length) {
    list.innerHTML = '<div class="portal-chat__empty">No messages in this conversation yet.</div>';
    return;
  }

  list.innerHTML = selectedMessages.map((message) => {
    const bubble = renderPortalMessageBubble(message);
    return `
      <article class="portal-chat__item ${bubble.outgoing ? 'is-outgoing' : 'is-incoming'}" data-message-id="${escapeHtml(message.id)}">
        <div class="portal-chat__bubble">
          <div class="portal-chat__meta">${escapeHtml(bubble.meta)}</div>
          <div class="portal-chat__body">${escapeHtml(message.body || '')}</div>
          <div class="portal-chat__time">${escapeHtml(formatDateTime(message.createdAt))}</div>
          <div class="portal-chat__actions">
            ${bubble.replyUserId ? `<button class="button button--ghost button--sm" type="button" data-reply-user-id="${escapeHtml(bubble.replyUserId)}" data-reply-user-name="${escapeHtml(bubble.replyUserName)}">Reply</button>` : ''}
            <button class="button button--ghost button--sm" type="button" data-delete-message-id="${escapeHtml(message.id)}">Delete</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  list.scrollTop = list.scrollHeight;
}

function ensurePortalMessageThreadsContainer(messagesListEl) {
  let threads = document.getElementById('portalMessageThreads');
  if (!threads) {
    if (!messagesListEl.parentElement) {
      throw new Error('Messages container has no parent');
    }
    threads = document.createElement('div');
    threads.id = 'portalMessageThreads';
    threads.className = 'portal-chat-threads';
    messagesListEl.parentElement.insertBefore(threads, messagesListEl);
  }

  if (threads.dataset.bound !== '1') {
    threads.dataset.bound = '1';
    threads.addEventListener('click', (event) => {
      const threadBtn = event.target.closest('[data-thread-user-id]');
      if (!threadBtn) return;
      const userId = asInt(threadBtn.dataset.threadUserId);
      if (!Number.isInteger(userId) || userId < 1) return;
      portalSelectedThreadUserId = Number(portalSelectedThreadUserId) === userId ? -1 : userId;
      refreshPortalMessagesLive(true);
    });
  }

  return threads;
}

function ensurePortalMessageSyncStatusContainer(messagesListEl) {
  let syncStatus = document.getElementById('portalMessageSyncStatus');
  if (syncStatus) return syncStatus;
  if (!messagesListEl || !messagesListEl.parentElement) return null;

  syncStatus = document.createElement('div');
  syncStatus.id = 'portalMessageSyncStatus';
  syncStatus.className = 'portal-chat-sync';
  syncStatus.setAttribute('aria-live', 'polite');
  syncStatus.style.display = 'none';
  messagesListEl.parentElement.insertBefore(syncStatus, messagesListEl);
  return syncStatus;
}

function setPortalMessageSyncStatus(message) {
  const messagesListEl = document.getElementById('portalMessagesList');
  if (!messagesListEl) return;

  const syncStatus = ensurePortalMessageSyncStatusContainer(messagesListEl);
  if (!syncStatus) return;

  const nextMessage = String(message || '').trim();
  if (!nextMessage) {
    syncStatus.textContent = '';
    syncStatus.style.display = 'none';
    return;
  }

  syncStatus.textContent = nextMessage;
  syncStatus.style.display = 'block';
}

function buildPortalMessageThreads(messages, contacts) {
  const byUser = new Map();

  (messages || []).forEach((message) => {
    const bubble = renderPortalMessageBubble(message);
    const userId = Number(bubble.replyUserId);
    if (!Number.isInteger(userId) || userId < 1) return;

    const createdAt = String(message.createdAt || '');
    const existing = byUser.get(userId);
    if (!existing) {
      byUser.set(userId, {
        userId,
        name: String(bubble.replyUserName || `User ${userId}`),
        preview: String(message.body || '').slice(0, 52) || 'No preview',
        latestAt: createdAt,
      });
      return;
    }

    if (createdAt >= existing.latestAt) {
      existing.preview = String(message.body || '').slice(0, 52) || 'No preview';
      existing.latestAt = createdAt;
      if (!existing.name || /^User\s+\d+$/i.test(existing.name)) {
        existing.name = String(bubble.replyUserName || existing.name);
      }
    }
  });

  return Array.from(byUser.values()).sort((a, b) => {
    if (a.latestAt && b.latestAt) return a.latestAt < b.latestAt ? 1 : -1;
    if (a.latestAt) return -1;
    if (b.latestAt) return 1;
    return String(a.name).localeCompare(String(b.name));
  });
}

function renderPortalMessageBubble(message) {
  const senderUserId = Number(message.senderUserId);
  const recipientUserId = Number(message.recipientUserId);
  const isOutgoing = senderUserId === Number(portalCurrentUserId);
  const peerUserId = isOutgoing ? recipientUserId : senderUserId;
  const peerName = isOutgoing
    ? (message.recipientName || `User ${peerUserId}`)
    : (message.senderName || `User ${peerUserId}`);
  const meta = isOutgoing
    ? `You to ${peerName}`
    : `${peerName} to you`;

  return {
    outgoing: isOutgoing,
    meta,
    replyUserId: Number.isInteger(peerUserId) && peerUserId > 0 ? String(peerUserId) : '',
    replyUserName: String(peerName || ''),
  };
}

function renderPortalMessageReplyAction(message) {
  const senderUserId = Number(message.senderUserId);
  const isIncoming = Number(message.recipientUserId) === Number(portalCurrentUserId);
  const canReply = Number.isInteger(senderUserId) && senderUserId > 0 && senderUserId !== Number(portalCurrentUserId) && isIncoming;
  if (!canReply) {
    return '<span class="badge badge--gray">-</span>';
  }
  return `<button class="button button--ghost button--sm" type="button" data-reply-user-id="${escapeHtml(senderUserId)}" data-reply-user-name="${escapeHtml(message.senderName || `User ${senderUserId}`)}">Reply</button>`;
}

function preparePortalMessageReply(targetUserId, targetName = '') {
  const form = document.getElementById('portalMessageForm');
  const recipientSelect = document.getElementById('portalMessageRecipient');
  const bodyField = document.getElementById('portalMessageBody');
  const status = document.getElementById('portalMessageStatus');

  if (!form || !recipientSelect || !bodyField) return;

  const selectedValue = String(targetUserId);
  const option = Array.from(recipientSelect.options).find((item) => item.value === selectedValue);
  if (!option) {
    setMessage(status, 'This sender is no longer available as a recipient.', 'error');
    return;
  }

  recipientSelect.value = selectedValue;
  if (!bodyField.value.trim()) {
    bodyField.value = `Hi ${targetName || 'there'}, `;
  }
  bodyField.focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadPortalMessages() {
  const messagesList = document.getElementById('portalMessagesList');
  if (!messagesList) return;

  try {
    const res = await apiFetch('/api/messages');
    if (!res.ok) {
      setPortalMessageSyncStatus('Reconnecting to messages...');
      const hasRenderedMessages = Boolean(messagesList.querySelector('.portal-chat__item'));
      if (!hasRenderedMessages) {
        messagesList.innerHTML = '<div class="portal-chat__empty">Unable to load messages right now.</div>';
      }
      return;
    }

    const payload = await res.json();
    renderPortalMessages(payload);
  } catch (_error) {
    setPortalMessageSyncStatus('Reconnecting to messages...');
    const hasRenderedMessages = Boolean(messagesList.querySelector('.portal-chat__item'));
    if (!hasRenderedMessages) {
      messagesList.innerHTML = '<div class="portal-chat__empty">Unable to load messages right now.</div>';
    }
  }
}

async function refreshPortalMessagesLive(force = false) {
  const messagesList = document.getElementById('portalMessagesList');
  if (!messagesList) return;
  if (portalMessageLiveInFlight) return;
  if (!force && document.visibilityState === 'hidden') return;

  portalMessageLiveInFlight = true;
  try {
    await loadPortalMessages();
  } finally {
    portalMessageLiveInFlight = false;
  }
}

function startPortalMessageLiveSync() {
  const messagesList = document.getElementById('portalMessagesList');
  if (!messagesList || portalMessageLiveBound) return;

  portalMessageLiveBound = true;
  refreshPortalMessagesLive(true);

  // Poll frequently so new messages appear without requiring a page reload.
  portalMessageLiveTimer = window.setInterval(() => {
    refreshPortalMessagesLive(false);
  }, 5000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshPortalMessagesLive(true);
    }
  });

  window.addEventListener('beforeunload', () => {
    if (portalMessageLiveTimer) {
      window.clearInterval(portalMessageLiveTimer);
      portalMessageLiveTimer = null;
    }
  });
}

function formatNotificationCategoryLabel(category) {
  const normalized = String(category || '').trim().toLowerCase();
  if (normalized === 'contract') return 'Contract';
  if (normalized === 'document') return 'Document';
  if (normalized === 'message') return 'Message';
  if (normalized === 'timesheet') return 'Timesheet';
  return 'Activity';
}

function renderPortalNotifications(items) {
  const rows = (items || []).map((item) => {
    const statusHtml = item.isCompleted
      ? '<span class="badge badge--green">Completed</span>'
      : item.taskType
        ? '<span class="badge badge--yellow">Pending Task</span>'
        : item.isRead
          ? '<span class="badge badge--gray">Seen</span>'
          : '<span class="badge badge--yellow">New</span>';
    const actionLabel = item.isCompleted ? 'Open' : (item.taskType ? 'Go to Task' : 'Open');
    return `
      <tr data-notification-row-id="${escapeHtml(item.id)}">
        <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
        <td>${escapeHtml(formatNotificationCategoryLabel(item.category))}</td>
        <td>
          <strong>${escapeHtml(item.title || 'Update')}</strong><br>
          <span style="color:var(--color-muted);font-size:0.88rem;">${escapeHtml(item.body || '')}</span>
        </td>
        <td>${statusHtml}</td>
        <td><button class="button button--ghost button--sm" type="button" data-notification-action-id="${escapeHtml(item.id)}">${escapeHtml(actionLabel)}</button></td>
        <td><button class="button button--danger button--sm" type="button" data-notification-delete-id="${escapeHtml(item.id)}" aria-label="Delete notification">Delete</button></td>
      </tr>
    `;
  });

  setTableRows('portalNotificationsList', rows, 6, 'No activity yet.');
}

async function loadPortalNotifications(limit = 25) {
  const tbody = document.getElementById('portalNotificationsList');
  if (!tbody) return [];

  const res = await apiFetch(`/api/portal/notifications?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) {
    setTableRows('portalNotificationsList', [], 6, 'Unable to load notifications right now.');
    return [];
  }

  const payload = await res.json().catch(() => ({}));
  const items = Array.isArray(payload.data) ? payload.data : [];
  renderPortalNotifications(items);
  return items;
}

async function refreshPortalNotifications(force = false) {
  const tbody = document.getElementById('portalNotificationsList');
  if (!tbody) return [];
  if (portalNotificationInFlight) return [];
  if (!force && document.visibilityState === 'hidden') return [];

  portalNotificationInFlight = true;
  try {
    return await loadPortalNotifications();
  } finally {
    portalNotificationInFlight = false;
  }
}

function showPortalRealtimeNotice(notification) {
  if (!notification || !notification.title) return;
  const status = document.getElementById('portalNotificationStatus');
  if (!status) return;
  setMessage(status, notification.title, 'neutral');
  window.setTimeout(() => {
    if (status.textContent === notification.title) {
      hideMessage(status);
    }
  }, 5000);
}

function highlightNotificationRow(notificationId) {
  const row = document.querySelector(`[data-notification-row-id="${String(notificationId)}"]`);
  if (!row) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const originalBoxShadow = row.style.boxShadow;
  row.style.boxShadow = '0 0 0 2px rgba(34, 139, 34, 0.28) inset';
  window.setTimeout(() => {
    row.style.boxShadow = originalBoxShadow;
  }, 1800);
}

async function markPortalNotificationRead(notificationId) {
  const parsedId = asInt(notificationId);
  if (!Number.isInteger(parsedId) || parsedId < 1) return;
  await apiFetch(`/api/portal/notifications/${parsedId}/read`, { method: 'PATCH' }).catch(() => null);
}

async function openAdminContractTask(contractId, track = '') {
  // Always fetch the current contract record so we use its live industryTrack,
  // not the potentially stale value stored in notification metadata.
  let resolvedTrack = String(track || '').trim().toLowerCase();
  if (Number.isInteger(contractId) && contractId > 0) {
    try {
      const res = await apiFetch(`/api/admin/contracts/${contractId}`);
      if (res.ok) {
        const live = await res.json().catch(() => ({}));
        if (live && live.industryTrack) resolvedTrack = String(live.industryTrack).toLowerCase();
      }
    } catch { /* fall back to hint in metadata */ }
  }
  const normalizedTrack = resolvedTrack === 'healthcare' ? 'healthcare' : 'warehouse';
  const sectionId = normalizedTrack === 'healthcare' ? 'adminContractsHealthcareSection' : 'adminContractsWarehouseSection';
  const tbodyId = normalizedTrack === 'healthcare' ? 'adminContractsHealthcareTbody' : 'adminContractsWarehouseTbody';
  const clientSelectId = normalizedTrack === 'healthcare' ? 'adminContractsHealthcareClient' : 'adminContractsWarehouseClient';
  populateContractClientSelect(clientSelectId, normalizedTrack);
  const items = await loadAdminContracts(normalizedTrack);
  if (normalizedTrack === 'healthcare') {
    adminState.contractsHealthcare = items;
  } else {
    adminState.contractsWarehouse = items;
  }
  renderAdminContractsTable(tbodyId, items);
  const section = document.getElementById(sectionId);
  if (section) {
    section.hidden = false;
    openPortalDrawerById(sectionId);
  }
  const contract = items.find((item) => Number(item.id) === Number(contractId));
  if (contract) {
    openAdminContractReview(contract);
  }
}

function focusAdminDocumentAction(docId) {
  const actionButton = document.querySelector(`[data-approve-doc-id="${String(docId)}"], [data-deny-doc-id="${String(docId)}"]`);
  const row = actionButton ? actionButton.closest('tr') : null;
  if (!row) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const originalBackground = row.style.background;
  row.style.background = 'rgba(34, 139, 34, 0.08)';
  window.setTimeout(() => {
    row.style.background = originalBackground;
  }, 1800);
}

async function openAdminDocumentTask(employeeId, docId) {
  if (!Number.isInteger(Number(employeeId)) || !Number.isInteger(Number(docId))) return;
  await loadAdminEmployeeDetail(Number(employeeId));
  focusAdminDocumentAction(Number(docId));
}

async function openJobsiteContractReviewById(contractId) {
  const parsedId = asInt(contractId);
  if (!Number.isInteger(parsedId) || parsedId < 1) return;

  const contractsSection = document.getElementById('jobsiteContractsSection');
  if (contractsSection) {
    openPortalDrawerById('jobsiteContractsSection');
  }

  const res = await apiFetch('/api/portal/jobsite/contracts');
  const payload = await res.json().catch(() => ({}));
  const contract = (Array.isArray(payload.data) ? payload.data : []).find((item) => Number(item.id) === parsedId);
  if (!contract) return;

  const contractReviewPanel = document.getElementById('jobsiteContractReviewPanel');
  const contractReviewMsg = document.getElementById('jobsiteContractReviewMessage');
  const contractReviewMeta = document.getElementById('jobsiteContractReviewMeta');
  const contractViewLink = document.getElementById('jobsiteContractViewLink');
  const contractSignBtn = document.getElementById('jobsiteContractSignBtn');
  const contractDeclineBtn = document.getElementById('jobsiteContractDeclineBtn');
  const contractWithdrawBtn = document.getElementById('jobsiteContractWithdrawBtn');
  const contractSignatureInput = document.getElementById('jobsiteContractSignature');
  const contractAuthorizeInput = document.getElementById('jobsiteContractAuthorize');
  const contractReasonInput = document.getElementById('jobsiteContractDeclineReason');
  const contractCredentialInput = document.getElementById('jobsiteContractWithdrawCredential');

  if (!contract || !contractReviewPanel || !contractReviewMeta || !contractViewLink || !contractSignBtn || !contractDeclineBtn || !contractWithdrawBtn) return;

  hideMessage(contractReviewMsg);
  const status = String(contract.status || 'pending');
  let renewalInfo = '';
  if (contract.renewalDueAt) {
    renewalInfo = ` | Renewal Due: ${escapeHtml(formatDateOnly(contract.renewalDueAt))}`;
  }
  contractReviewMeta.innerHTML = `Facility: ${escapeHtml(contract.clientCompanyName || contract.clientContactName || contract.clientUserName || 'Facility')} | Status: ${statusBadge(status)} | Viewed: ${contract.clientOpenedAt ? escapeHtml(formatDateTime(contract.clientOpenedAt)) : 'No'} | Admin Signed: ${contract.adminSignedAt ? escapeHtml(formatDateTime(contract.adminSignedAt)) : 'No'}${renewalInfo}`;
  contractViewLink.href = String(contract.fileUrl || '#');
  contractSignBtn.dataset.contractId = String(contract.id);
  contractDeclineBtn.dataset.contractId = String(contract.id);
  contractWithdrawBtn.dataset.contractId = String(contract.id);
  if (contractSignatureInput) contractSignatureInput.value = '';
  if (contractAuthorizeInput) contractAuthorizeInput.checked = false;
  if (contractReasonInput) contractReasonInput.value = '';
  if (contractCredentialInput) contractCredentialInput.value = '';

  // Show/hide action elements based on status
  contractSignBtn.style.display = status === 'pending' && !contract.clientSignedAt ? '' : 'none';
  contractDeclineBtn.style.display = status === 'pending' ? '' : 'none';
  contractWithdrawBtn.style.display = status === 'pending' ? '' : 'none';

  // Cancellation initiation panel (only for executed contracts, not already in withdrawal)
  const cancelPanel = document.getElementById('jobsiteContractCancelPanel');
  const cancelSubmitBtn = document.getElementById('jobsiteContractCancelSubmitBtn');
  const cancelReasonInput = document.getElementById('jobsiteContractCancelReason');
  const cancelSigInput = document.getElementById('jobsiteContractCancelSignature');
  if (cancelPanel) {
    cancelPanel.style.display = status === 'executed' ? '' : 'none';
    if (cancelSubmitBtn) cancelSubmitBtn.dataset.contractId = String(contract.id);
    if (cancelReasonInput) cancelReasonInput.value = '';
    if (cancelSigInput) cancelSigInput.value = '';
  }

  // Withdrawal pending: show status note
  if (status === 'withdrawal_pending') {
    const sigDate = contract.clientWithdrawalSignedAt ? formatDateTime(contract.clientWithdrawalSignedAt) : 'N/A';
    const sigName = contract.clientWithdrawalSignatureName || 'N/A';
    const note = document.createElement('p');
    note.style.cssText = 'color:var(--color-warning,#f59e0b);font-size:0.9rem;margin:0.5rem 0;';
    note.textContent = `Cancellation initiated by you on ${sigDate} (signed: ${sigName}). Awaiting administrator confirmation.`;
    if (contractReviewMsg) contractReviewMsg.insertAdjacentElement('afterend', note);
  }

  // Renewal panel
  const renewalPanel = document.getElementById('jobsiteContractRenewalPanel');
  const renewBtn = document.getElementById('jobsiteContractRenewBtn');
  const denyRenewalBtn = document.getElementById('jobsiteContractDenyRenewalBtn');
  const renewSigRow = document.getElementById('jobsiteRenewalSignatureRow');
  if (renewalPanel) {
    renewalPanel.style.display = ['renewal_pending', 'executed'].includes(status) && contract.renewalNotifiedAt ? '' : 'none';
    if (renewBtn) renewBtn.dataset.contractId = String(contract.id);
    if (denyRenewalBtn) denyRenewalBtn.dataset.contractId = String(contract.id);
    if (renewSigRow) renewSigRow.style.display = 'none';
    const renewSigInput = document.getElementById('jobsiteContractRenewalSignature');
    if (renewSigInput) renewSigInput.value = '';
    // Show client decision if already made
    const clientDecision = contract.renewalClientDecision;
    if (clientDecision && renewalPanel.style.display !== 'none') {
      const dNote = document.createElement('p');
      dNote.style.cssText = 'font-size:0.9rem;margin:0.3rem 0;color:var(--color-muted);';
      dNote.textContent = `Your decision: ${clientDecision.charAt(0).toUpperCase() + clientDecision.slice(1)}. Awaiting administrator decision.`;
      renewalPanel.prepend(dNote);
    }
  }

  contractReviewPanel.style.display = 'block';
  contractReviewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openMessagesTask() {
  const form = document.getElementById('portalMessageForm');
  const list = document.getElementById('portalMessagesList');
  const target = form || list;
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openScopedAdminTimesheetTask() {
  const pageType = String(document.body?.dataset?.portalPage || '').trim().toLowerCase();
  if (pageType === 'scheduling') {
    const section = document.getElementById('schedulingTimesheetsTbody')?.closest('.portal-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  const section = document.getElementById('adminTimesheetsSection');
  if (section) {
    openPortalDrawerById('adminTimesheetsSection');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function handlePortalNotificationAction(item) {
  if (!item) return;
  await markPortalNotificationRead(item.id);

  const pageType = String(document.body?.dataset?.portalPage || '').trim().toLowerCase();
  const metadata = item.metadata || {};

  if (item.taskType === 'document_review' && (pageType === 'admin' || pageType === 'onboarding')) {
    await openAdminDocumentTask(asInt(metadata.employeeId), asInt(metadata.docId || item.taskRefId));
    return;
  }

  if (item.taskType === 'contract_admin_sign' && (pageType === 'admin' || pageType === 'contracts')) {
    await openAdminContractTask(asInt(metadata.contractId || item.taskRefId), metadata.track || '');
    return;
  }

  if (item.taskType === 'contract_review' && pageType === 'jobsite') {
    await openJobsiteContractReviewById(asInt(metadata.contractId || item.taskRefId));
    return;
  }

  if (item.taskType === 'contract_renewal' && pageType === 'jobsite') {
    await openJobsiteContractReviewById(asInt(metadata.contractId || item.taskRefId));
    return;
  }

  if ((item.taskType === 'contract_renewal' || item.taskType === 'contract_cancel_confirm') && (pageType === 'admin' || pageType === 'contracts')) {
    await openAdminContractTask(asInt(metadata.contractId || item.taskRefId), metadata.track || '');
    return;
  }

  if (item.taskType === 'messages') {
    openMessagesTask();
    return;
  }

  const adminPages = new Set(['admin', 'onboarding', 'scheduling']);
  if (item.category === 'document' && adminPages.has(pageType) && metadata.employeeId) {
    await loadAdminEmployeeDetail(asInt(metadata.employeeId));
    return;
  }

  if (item.category === 'activity' && adminPages.has(pageType) && (metadata.employeeId || metadata.newUserId)) {
    const empId = asInt(metadata.employeeId || metadata.newUserId);
    if (Number.isInteger(empId) && empId > 0) {
      await loadAdminEmployeeDetail(empId);
      return;
    }
  }

  if (item.category === 'timesheet' && adminPages.has(pageType)) {
    openScopedAdminTimesheetTask();
    return;
  }

  if (item.category === 'activity' && pageType === 'employee') {
    // Background status update — just mark read, already on the right page
    return;
  }

  if (item.url) {
    window.location.href = item.url;
  }
}

function bindPortalNotifications() {
  const tbody = document.getElementById('portalNotificationsList');
  if (!tbody || tbody.dataset.bound === '1') return;
  tbody.dataset.bound = '1';
  tbody.addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('[data-notification-delete-id]');
    if (deleteBtn) {
      const notificationId = asInt(deleteBtn.dataset.notificationDeleteId);
      if (!Number.isInteger(notificationId) || notificationId < 1) return;
      deleteBtn.disabled = true;
      try {
        await apiFetch(`/api/portal/notifications/${notificationId}`, { method: 'DELETE' });
        await refreshPortalNotifications(true);
      } finally {
        deleteBtn.disabled = false;
      }
      return;
    }

    const actionBtn = event.target.closest('[data-notification-action-id]');
    if (!actionBtn) return;
    const notificationId = asInt(actionBtn.dataset.notificationActionId);
    if (!Number.isInteger(notificationId) || notificationId < 1) return;
    const items = await loadPortalNotifications();
    const item = items.find((entry) => Number(entry.id) === notificationId);
    if (!item) return;
    await handlePortalNotificationAction(item);
    await refreshPortalNotifications(true);
    highlightNotificationRow(notificationId);
  });

  const clearReadBtn = document.getElementById('portalNotificationsClearReadBtn');
  if (clearReadBtn && clearReadBtn.dataset.bound !== '1') {
    clearReadBtn.dataset.bound = '1';
    clearReadBtn.addEventListener('click', async () => {
      clearReadBtn.disabled = true;
      const prev = clearReadBtn.textContent;
      clearReadBtn.textContent = 'Clearing...';
      try {
        await apiFetch('/api/portal/notifications', { method: 'DELETE' });
        await refreshPortalNotifications(true);
      } finally {
        clearReadBtn.disabled = false;
        clearReadBtn.textContent = prev;
      }
    });
  }
}

async function refreshPortalForDomains(domains, currentUser) {
  const set = new Set(Array.isArray(domains) ? domains : []);
  const pageType = String(document.body?.dataset?.portalPage || '').trim().toLowerCase();

  if (set.has('notifications')) {
    await refreshPortalNotifications(true);
  }
  if (set.has('messages')) {
    await refreshPortalMessagesLive(true);
  }
  if (pageType === 'employee') {
    if (set.has('employee-dashboard') || set.has('documents')) {
      await loadEmployeeDashboard(currentUser);
    }
    if (set.has('timesheets')) {
      await loadEmployeeTimesheets();
    }
    if (set.has('misc-docs')) {
      const miscDocs = await loadEmployeeMiscDocs();
      renderEmployeeMiscDocs(miscDocs);
    }
  }
  if (pageType === 'jobsite') {
    if (set.has('jobsite-dashboard')) {
      await loadJobsiteDashboard(currentUser);
    } else if (set.has('timesheets')) {
      await loadJobsiteTimesheets();
        if (set.has('misc-docs')) {
          const miscDocs = await loadJobsiteMiscDocs();
          renderJobsiteMiscDocs(miscDocs);
        }
    }
  }
  if (pageType === 'admin' && (set.has('admin-dashboard') || set.has('timesheets') || set.has('documents') || set.has('contracts') || set.has('jobsite-dashboard'))) {
    await loadAdminDashboard(currentUser);
    if (Number.isInteger(adminState.selectedEmployeeId) && adminState.selectedEmployeeId > 0) {
      await loadAdminEmployeeDetail(adminState.selectedEmployeeId);
    }
  }
  if (pageType === 'scheduling' && (set.has('admin-dashboard') || set.has('jobsite-dashboard') || set.has('contracts') || set.has('timesheets'))) {
    await loadSchedulingPortalData(currentUser);
  }
  if (pageType === 'onboarding' && (set.has('admin-dashboard') || set.has('documents'))) {
    await loadOnboardingPortalData(currentUser);
  }
  if (pageType === 'contracts' && set.has('contracts')) {
    await loadContractsPortalData(currentUser);
  }
  if (set.has('contracts')) {
    if (pageType === 'jobsite') {
      await loadJobsiteContracts();
    }
    if (pageType === 'admin' || pageType === 'contracts') {
      const bankSection = document.getElementById('adminContractsBankSection');
      if (bankSection && !bankSection.hidden) {
        adminState.contractsBank = await loadAdminContractsBank();
        renderAdminContractsBankTable(adminState.contractsBank);
      }
      const allSection = document.getElementById('adminContractsAllSection');
      if (allSection && !allSection.hidden) {
        adminState.contractsAll = await loadAdminContracts();
        renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
      }
      const warehouseSection = document.getElementById('adminContractsWarehouseSection');
      if (warehouseSection && !warehouseSection.hidden) {
        adminState.contractsWarehouse = await loadAdminContracts('warehouse');
        renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse);
      }
      const healthcareSection = document.getElementById('adminContractsHealthcareSection');
      if (healthcareSection && !healthcareSection.hidden) {
        adminState.contractsHealthcare = await loadAdminContracts('healthcare');
        renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
      }
      const miscSection = document.getElementById('adminMiscDocsSection');
      if (miscSection && !miscSection.hidden) {
        adminState.miscDocs = await loadAdminMiscDocs();
        renderAdminMiscDocsTable(adminState.miscDocs);
      }
    }
  }
  if (set.has('misc-docs')) {
    if (pageType === 'admin' || pageType === 'contracts' || pageType === 'onboarding') {
      const miscSection = document.getElementById('adminMiscDocsSection');
      if (miscSection && !miscSection.hidden) {
        adminState.miscDocs = await loadAdminMiscDocs();
        renderAdminMiscDocsTable(adminState.miscDocs);
      }
    }
  }
}

function startPortalRealtimeSync(currentUser) {
  if (portalRealtimeBound) return;
  const token = getToken();
  if (!token) return;

  portalRealtimeBound = true;
  const connect = () => {
    const streamUrl = `${API_BASE_URL}/api/realtime/stream?token=${encodeURIComponent(token)}`;
    portalRealtimeSource = new EventSource(streamUrl);

    portalRealtimeSource.addEventListener('connected', () => {
      portalRealtimeReconnectAttempts = 0;
      if (portalRealtimeReconnectTimer) {
        window.clearTimeout(portalRealtimeReconnectTimer);
        portalRealtimeReconnectTimer = null;
      }
    });

    portalRealtimeSource.addEventListener('portal-sync', async (event) => {
      const payload = JSON.parse(event.data || '{}');
      if (payload.notification) {
        showPortalRealtimeNotice(payload.notification);
      }
      await refreshPortalForDomains(payload.domains || [], currentUser);
    });

    portalRealtimeSource.onerror = () => {
      if (portalRealtimeSource) {
        portalRealtimeSource.close();
      }
      portalRealtimeSource = null;
      portalRealtimeReconnectAttempts += 1;
      const delay = Math.min(15000, 1000 * portalRealtimeReconnectAttempts);
      if (!portalRealtimeReconnectTimer) {
        portalRealtimeReconnectTimer = window.setTimeout(() => {
          portalRealtimeReconnectTimer = null;
          connect();
        }, delay);
      }
    };
  };

  connect();
  window.addEventListener('beforeunload', () => {
    if (portalRealtimeSource) portalRealtimeSource.close();
    if (portalRealtimeReconnectTimer) window.clearTimeout(portalRealtimeReconnectTimer);
  }, { once: true });
}

async function handlePortalNotificationIntent(currentUser) {
  const params = new URLSearchParams(window.location.search);
  const task = String(params.get('task') || '').trim().toLowerCase();
  if (!task) return;

  if (task === 'messages') {
    openMessagesTask();
  }

  if (task === 'document-review' && ['admin', 'onboarding'].includes(String(document.body?.dataset?.portalPage || '').toLowerCase())) {
    await openAdminDocumentTask(asInt(params.get('employeeId')), asInt(params.get('docId')));
  }

  if (task === 'admin-contract' && ['admin', 'contracts'].includes(String(document.body?.dataset?.portalPage || '').toLowerCase())) {
    await openAdminContractTask(asInt(params.get('contractId')), params.get('track') || '');
  }

  if (task === 'jobsite-contract' && String(document.body?.dataset?.portalPage || '').toLowerCase() === 'jobsite') {
    await openJobsiteContractReviewById(asInt(params.get('contractId')));
  }

  if (task === 'employee-documents' && String(document.body?.dataset?.portalPage || '').toLowerCase() === 'employee') {
    const documentType = String(params.get('documentType') || '').trim().toLowerCase();
    if (documentType) {
      openEmployeeUploadForDocumentType(documentType);
    } else {
      const uploadSection = document.getElementById('employeeUploadSection');
      if (uploadSection) openPortalDrawerById('employeeUploadSection');
    }
  }

  if (task === 'employee-profile' && ['admin', 'onboarding', 'scheduling'].includes(String(document.body?.dataset?.portalPage || '').toLowerCase())) {
    const employeeId = asInt(params.get('employeeId'));
    if (Number.isInteger(employeeId) && employeeId > 0) {
      await loadAdminEmployeeDetail(employeeId);
    }
  }

  if (task === 'timesheet-review' && ['admin', 'scheduling'].includes(String(document.body?.dataset?.portalPage || '').toLowerCase())) {
    openScopedAdminTimesheetTask();
  }

  clearUrlParams(['task', 'employeeId', 'docId', 'contractId', 'track', 'timesheetId', 'documentType']);
}

function formatReminderDeliverySummary(delivery = {}) {
  const orderedChannels = ['portal', 'email', 'push', 'sms'];
  return orderedChannels
    .filter((channel) => delivery && delivery[channel])
    .map((channel) => {
      const entry = delivery[channel] || {};
      if (entry.status === 'sent') return `${channel}: sent`;
      if (entry.status === 'skipped') return `${channel}: skipped (${entry.reason || 'unavailable'})`;
      if (entry.status === 'failed') return `${channel}: failed (${entry.reason || 'error'})`;
      return `${channel}: ${entry.status || 'unknown'}`;
    })
    .join(' | ');
}

function resolvePortalPrioritySections(pageType, sections) {
  const normalizedPage = String(pageType || '').toLowerCase();
  const titleMap = {
    employee: ['open shifts', 'messages', 'notifications'],
    jobsite: ['platform open shifts', 'messages', 'notifications'],
    admin: ['jobs', 'messages', 'notifications'],
  };

  const targets = titleMap[normalizedPage] || [];
  const picked = [];

  targets.forEach((target) => {
    const found = sections.find((section) => {
      if (picked.includes(section)) return false;
      const title = section.querySelector('.portal-section__title');
      const text = String(title ? title.textContent : '').trim().toLowerCase();
      return text === target;
    });
    if (found) picked.push(found);
  });

  return picked;
}

function shouldDisableDrawerForSection(pageType, section) {
  const normalizedPage = String(pageType || '').toLowerCase();
  if (normalizedPage !== 'admin' || !section) return false;

  const title = section.querySelector('.portal-section__title');
  const text = String(title ? title.textContent : '').trim().toLowerCase();
  return text === 'messages' || text === 'notifications';
}

function bindOnboardingDrawerTiles() {
  ensurePortalDrawer();

  const bindings = [
    { buttonId: 'onboardingOpenEmployeesBtn', sectionId: 'onboardingEmployeesSection' },
    { buttonId: 'onboardingOpenAccountBtn', sectionId: 'portalAccountSection' },
    { buttonId: 'onboardingOpenMiscBtn', sectionId: 'adminMiscDocsSection' },
  ];

  bindings.forEach(({ buttonId, sectionId }) => {
    const button = document.getElementById(buttonId);
    const section = document.getElementById(sectionId);
    if (!button || !section || button.dataset.bound === '1') return;

    button.dataset.bound = '1';
    section.dataset.preserveDrawerLayout = '1';
    button.addEventListener('click', () => {
      section.hidden = false;
      openPortalDrawerById(section.id);
    });
  });

  const closeBindings = [
    { closeBtnId: 'onboardingEmployeesCloseBtn', sectionId: 'onboardingEmployeesSection' },
    { closeBtnId: 'onboardingAccountCloseBtn', sectionId: 'portalAccountSection' },
    { closeBtnId: 'onboardingMiscCloseBtn', sectionId: 'adminMiscDocsSection' },
  ];

  closeBindings.forEach(({ closeBtnId, sectionId }) => {
    const closeBtn = document.getElementById(closeBtnId);
    const section = document.getElementById(sectionId);
    if (!closeBtn || !section || closeBtn.dataset.bound === '1') return;

    closeBtn.dataset.bound = '1';
    closeBtn.addEventListener('click', () => {
      section.hidden = true;
      closePortalDrawer();
    });
  });
}

function ensurePortalDrawer() {
  if (portalDrawerOverlay && portalDrawerContent && portalDrawerStash) return;

  portalDrawerOverlay = document.createElement('div');
  portalDrawerOverlay.className = 'portal-drawer-overlay';
  portalDrawerOverlay.innerHTML = `
    <div class="portal-drawer" role="dialog" aria-modal="true" aria-label="Detail drawer">
      <div class="portal-drawer__header">
        <h3 class="portal-drawer__title">Details</h3>
        <button class="button button--ghost button--sm" type="button" id="portalDrawerCloseBtn">Close</button>
      </div>
      <div class="portal-drawer__content" id="portalDrawerContent"></div>
    </div>
  `;

  portalDrawerContent = portalDrawerOverlay.querySelector('#portalDrawerContent');
  portalDrawerStash = document.createElement('div');
  portalDrawerStash.className = 'portal-drawer-stash';
  portalDrawerStash.hidden = true;

  document.body.appendChild(portalDrawerOverlay);
  document.body.appendChild(portalDrawerStash);

  const closeBtn = portalDrawerOverlay.querySelector('#portalDrawerCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePortalDrawer);
  }

  portalDrawerOverlay.addEventListener('click', (event) => {
    if (event.target === portalDrawerOverlay) {
      closePortalDrawer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePortalDrawer();
    }
  });
}

function openPortalDrawerById(sectionId) {
  if (!sectionId) return;
  ensurePortalDrawer();

  const section = document.getElementById(sectionId);
  if (!section || !portalDrawerContent) return;

  if (portalDrawerActiveSection && portalDrawerActiveSection !== section) {
    const fallbackTarget = portalDrawerStash;
    const target = portalDrawerReturnTarget || fallbackTarget;
    if (target) {
      target.appendChild(portalDrawerActiveSection);
    }
  }

  const preserveLayout = section.dataset.preserveDrawerLayout === '1';
  portalDrawerReturnTarget = preserveLayout && section.parentElement
    ? section.parentElement
    : portalDrawerStash;

  portalDrawerActiveSection = section;
  portalDrawerContent.innerHTML = '';
  portalDrawerContent.appendChild(section);

  const title = section.querySelector('.portal-section__title');
  const titleEl = portalDrawerOverlay.querySelector('.portal-drawer__title');
  if (titleEl) {
    titleEl.textContent = section.dataset.tileTitle || (title ? String(title.textContent || '').trim() : 'Details');
  }

  portalDrawerOverlay.classList.add('is-open');
  document.body.classList.add('portal-drawer-open');
}

function closePortalDrawer() {
  if (!portalDrawerOverlay) return;

  if (portalDrawerActiveSection) {
    const fallbackTarget = portalDrawerStash;
    const target = portalDrawerReturnTarget || fallbackTarget;

    if (portalDrawerActiveSection.id === 'employeeUploadSection') {
      portalDrawerActiveSection.hidden = true;
    }

    if (target) {
      target.appendChild(portalDrawerActiveSection);
    }
  }

  portalDrawerActiveSection = null;
  portalDrawerReturnTarget = null;
  portalDrawerOverlay.classList.remove('is-open');
  document.body.classList.remove('portal-drawer-open');
}

function openEmployeeUploadForDocumentType(documentType = '') {
  const form = document.getElementById('employeeDocumentForm');
  if (!form) return;

  const normalizedType = String(documentType || '').trim();
  const typeSelect = form.documentType;
  if (normalizedType && typeSelect) {
    const hasOption = Array.from(typeSelect.options || []).some((option) => String(option.value || '').trim() === normalizedType);
    if (!hasOption) {
      const fallbackOption = document.createElement('option');
      fallbackOption.value = normalizedType;
      fallbackOption.textContent = DOCUMENT_TYPE_LABELS[normalizedType] || normalizedType;
      fallbackOption.dataset.dynamicUploadFallback = '1';
      typeSelect.appendChild(fallbackOption);
      console.warn('Checklist upload fallback added missing document type option.', { documentType: normalizedType });
    }

    typeSelect.value = normalizedType;
    typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const uploadSection = form.closest('.portal-section');
  if (uploadSection) {
    uploadSection.hidden = false;
    if (!uploadSection.id) uploadSection.id = 'employeeUploadSection';
    openPortalDrawerById(uploadSection.id);
  }

  if (form.document) {
    window.setTimeout(() => {
      form.document.focus();
    }, 120);
  }
}

function canAdminUploadChecklistItem(item) {
  return Boolean(document.getElementById('adminChecklistUploadForm'))
    && item
    && item.kind === 'document'
    && String(item.documentType || '').trim().toLowerCase() !== 'background_check';
}

function syncAdminChecklistUploadExpirationField(requiresExpiration) {
  const expirationRow = document.getElementById('adminChecklistUploadExpirationRow');
  const expirationInput = document.getElementById('adminChecklistUploadExpirationDate');
  const needsExpiration = Boolean(requiresExpiration);

  if (expirationRow) expirationRow.hidden = !needsExpiration;
  if (expirationInput) {
    expirationInput.disabled = !needsExpiration;
    if (!needsExpiration) expirationInput.value = '';
  }
}

function closeAdminChecklistUploadForm(options = {}) {
  const form = document.getElementById('adminChecklistUploadForm');
  const message = document.getElementById('adminChecklistUploadMessage');
  const typeInput = document.getElementById('adminChecklistUploadDocumentType');
  const label = document.getElementById('adminChecklistUploadFileLabel');
  const clearMessage = options.clearMessage !== false;

  if (!form) return;

  form.hidden = true;
  form.reset();
  form.dataset.requiresExpiration = '0';
  form.dataset.documentLabel = '';
  if (typeInput) typeInput.value = '';
  if (label) label.textContent = 'Upload Employee Document';
  syncAdminChecklistUploadExpirationField(false);
  if (clearMessage && message) hideMessage(message);
}

function openAdminChecklistUploadFormForItem(item) {
  const form = document.getElementById('adminChecklistUploadForm');
  const typeInput = document.getElementById('adminChecklistUploadDocumentType');
  const label = document.getElementById('adminChecklistUploadFileLabel');
  const fileInput = document.getElementById('adminChecklistUploadFile');
  const message = document.getElementById('adminChecklistUploadMessage');
  const documentType = String(item && item.documentType ? item.documentType : '').trim().toLowerCase();
  const documentLabel = String(item && item.label ? item.label : DOCUMENT_TYPE_LABELS[documentType] || documentType || 'Employee Document').trim();
  const requiresExpiration = Boolean(item && item.requiresExpiration);

  if (!form || !typeInput || !documentType) return;

  form.reset();
  form.hidden = false;
  form.dataset.requiresExpiration = requiresExpiration ? '1' : '0';
  form.dataset.documentLabel = documentLabel;
  typeInput.value = documentType;
  if (label) label.textContent = `Upload ${documentLabel}`;
  syncAdminChecklistUploadExpirationField(requiresExpiration);
  if (message) hideMessage(message);

  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (fileInput) {
    window.setTimeout(() => {
      fileInput.focus();
    }, 50);
  }
}

function buildPortalTileSummary(section) {
  const explicitSummary = String(section?.dataset?.tileSummary || '').trim();
  if (explicitSummary) return explicitSummary;

  const tbodies = Array.from(section.querySelectorAll('tbody'));
  if (tbodies.length) {
    const totalEntries = tbodies.reduce((sum, tbody) => {
      const explicitCount = asInt(tbody.dataset.entryCount);
      if (Number.isInteger(explicitCount) && explicitCount >= 0) {
        return sum + explicitCount;
      }

      const fallbackCount = Array.from(tbody.querySelectorAll('tr'))
        .filter((row) => row.dataset.emptyRow !== '1').length;
      return sum + fallbackCount;
    }, 0);

    return `${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'} available`;
  }

  const formRows = section.querySelectorAll('.form-row').length;
  if (formRows > 0) {
    return `${formRows} fields available`;
  }

  const paragraph = section.querySelector('p');
  if (paragraph && String(paragraph.textContent || '').trim()) {
    return String(paragraph.textContent || '').trim().slice(0, 120);
  }

  return 'Open tile for full details';
}

function syncEmployeeTrainingSection(industry) {
  const trainingSection = document.getElementById('employeeTrainingSection');
  if (!trainingSection) return;

  const normalizedIndustry = String(industry || '').trim().toLowerCase();
  trainingSection.hidden = !HEALTHCARE_INDUSTRIES.has(normalizedIndustry);
}

function setupPortalWidgetLayout(pageType) {
  if (portalWidgetLayoutBound) return;

  const root = document.querySelector('main .container');
  if (!root) return;

  const allSections = Array.from(root.querySelectorAll('.portal-section'));
  if (!allSections.length) return;

  const excludedSectionIds = new Set([
    'jobsiteEditSection',
    'jobsiteSchedulePickerSection',
    'adminEmployeeDetailSection',
    'employeeUploadSection',
    'employeeSsnSection',
    'portalNotificationsSection',
    'portalMessagesSection',
  ]);
  const prioritySections = resolvePortalPrioritySections(pageType, allSections)
    .filter((section) => !excludedSectionIds.has(section.id));

  const priorityHost = document.createElement('section');
  priorityHost.className = 'portal-priority-grid';

  prioritySections.forEach((section, index) => {
    if (!section.id) {
      section.id = `portalPrioritySection${index + 1}`;
    }

    section.dataset.preserveDrawerLayout = '1';
    section.classList.add('portal-priority-card');

    if (shouldDisableDrawerForSection(pageType, section)) {
      section.style.cursor = 'default';
    } else {
      section.addEventListener('click', () => {
        if (!priorityHost.contains(section)) return;
        openPortalDrawerById(section.id);
      });
    }

    priorityHost.appendChild(section);
  });

  if (priorityHost.children.length) {
    const statRow = root.querySelector('.stat-row');
    if (statRow && statRow.nextSibling) {
      root.insertBefore(priorityHost, statRow.nextSibling);
    } else if (statRow) {
      root.appendChild(priorityHost);
    } else {
      root.prepend(priorityHost);
    }
  }

  const tileSections = allSections.filter((section) => {
    if (prioritySections.includes(section)) return false;
    if (excludedSectionIds.has(section.id)) return false;
    if (section.hidden) return false;
    return true;
  });

  if (!tileSections.length) {
    portalWidgetLayoutBound = true;
    return;
  }

  ensurePortalDrawer();

  const tileGrid = document.createElement('section');
  tileGrid.className = 'portal-widget-grid';

  tileSections.forEach((section, index) => {
    if (!section.id) {
      section.id = `portalTileSection${index + 1}`;
    }

    const title = section.querySelector('.portal-section__title');
    const titleText = section.dataset.tileTitle || (title ? String(title.textContent || '').trim() : 'Details');
    const summaryText = buildPortalTileSummary(section);

    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'portal-widget-tile';
    tile.dataset.sectionId = section.id;
    tile.innerHTML = `
      <span class="portal-widget-tile__title">${escapeHtml(titleText)}</span>
      <span class="portal-widget-tile__summary">${escapeHtml(summaryText)}</span>
      <span class="portal-widget-tile__hint">Tap to open</span>
    `;

    if (shouldDisableDrawerForSection(pageType, section)) {
      tile.disabled = true;
      tile.style.cursor = 'default';
      tile.querySelector('.portal-widget-tile__hint').textContent = 'Available inline';
    } else {
      tile.addEventListener('click', () => {
        openPortalDrawerById(section.id);
      });
    }

    tileGrid.appendChild(tile);
    if (portalDrawerStash) {
      portalDrawerStash.appendChild(section);
    }
  });

  const techSupportTile = document.createElement('a');
  techSupportTile.className = 'portal-widget-tile';
  techSupportTile.href = 'https://meet.google.com/qre-frde-rhz';
  techSupportTile.target = '_blank';
  techSupportTile.rel = 'noopener noreferrer';
  techSupportTile.innerHTML = `
    <span class="portal-widget-tile__title">Tech Support</span>
    <span class="portal-widget-tile__summary">Need help? Join Tech Support</span>
    <span class="portal-widget-tile__hint">Must have Gmail account to access the meeting</span>
  `;
  tileGrid.appendChild(techSupportTile);

  root.appendChild(tileGrid);

  Array.from(root.querySelectorAll('.portal-cols')).forEach((cols) => {
    if (!cols.querySelector('.portal-section')) {
      cols.remove();
    }
  });

  refreshPortalTileSummaries();
  portalWidgetLayoutBound = true;
}

function renderEmployeeOpenShifts(payload) {
  const messageEl = document.getElementById('employeeOpenShiftMessage');
  const shifts = Array.isArray(payload.data) ? payload.data : [];
  const blockedReason = String(payload.shiftAccessBlockedReason || '').trim().toLowerCase();
  const blockedMessage = String(payload.shiftAccessMessage || '').trim();
  const rows = shifts.map((shift) => `
    <tr>
      <td>${escapeHtml(shift.id)}</td>
      <td>${escapeHtml(shift.title)}</td>
      <td>${escapeHtml(shift.companyName || shift.jobsiteName || 'Progress Staffing')}${shift.clientAddress ? `<br><span style="font-size:0.78rem;color:var(--color-muted)">${escapeHtml(shift.clientAddress)}</span>` : ''}</td>
      <td>${escapeHtml(shift.schedule || '—')}</td>
      <td>${escapeHtml(shift.payRate || '—')}${shift.statPayEnabled ? `<br>${statPayApprovalMarkup(shift)}` : ''}</td>
      <td>
        <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
          <button class="button button--sm" type="button" data-accept-shift-id="${escapeHtml(shift.id)}">Accept</button>
          <button class="button button--ghost button--sm" type="button" data-decline-shift-id="${escapeHtml(shift.id)}">Decline</button>
        </div>
      </td>
    </tr>
  `);

  if (messageEl && blockedReason === 'incomplete_documents') {
    setMessage(messageEl, blockedMessage || getEmployeeOnboardingBlockMessage(payload.shiftAccessCompliance || employeeCompliance, 'view open shifts'), 'neutral');
  } else if (messageEl && payload.employeeTitle && !shifts.length) {
    setMessage(messageEl, `No open ${payload.employeeTitle} shifts are available right now.`, 'neutral');
  }

  if (messageEl && !payload.employeeTitle) {
    setMessage(messageEl, 'Add an application with your job title to receive matching open shifts.', 'error');
  }

  setTableRows('employeeOpenShifts', rows, 6, 'No matching open shifts right now.');
}

function renderEmployeeShiftOffers(payload) {
  const messageEl = document.getElementById('employeeShiftOfferMessage');
  const offers = Array.isArray(payload.data) ? payload.data : [];
  const rows = offers.map((offer) => {
    let actionHtml = '<span class="badge badge--gray">Closed</span>';
    if (offer.status === 'pending') {
      if (employeeOnboardingStatus === 'active') {
        actionHtml = `
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
            <button class="button button--sm" type="button" data-accept-offer-id="${escapeHtml(offer.id)}">Accept</button>
            <button class="button button--ghost button--sm" type="button" data-decline-offer-id="${escapeHtml(offer.id)}">Decline</button>
          </div>
        `;
      } else {
        actionHtml = `
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;align-items:center;">
            <button class="button button--sm" type="button" disabled>Accept</button>
            <button class="button button--ghost button--sm" type="button" data-decline-offer-id="${escapeHtml(offer.id)}">Decline</button>
            <span style="font-size:0.78rem;color:var(--color-muted)">${escapeHtml(getEmployeeOnboardingBlockMessage(employeeCompliance, 'accept private shift offers'))}</span>
          </div>
        `;
      }
    }

    return `
      <tr>
        <td>${escapeHtml(offer.id)}</td>
        <td>${escapeHtml(offer.shiftTitle || '—')}</td>
        <td>${escapeHtml(offer.fromEmployeeName || '—')}</td>
        <td>${escapeHtml(offer.companyName || '—')}${offer.clientAddress ? `<br><span style="font-size:0.78rem;color:var(--color-muted)">${escapeHtml(offer.clientAddress)}</span>` : ''}</td>
        <td>${statusBadge(offer.status)}</td>
        <td>${actionHtml}</td>
      </tr>
    `;
  });

  setTableRows('employeeShiftOffers', rows, 6, 'No private shift offers right now.');
  if (messageEl && employeeOnboardingStatus !== 'active' && offers.some((offer) => offer.status === 'pending')) {
    setMessage(messageEl, getEmployeeOnboardingBlockMessage(employeeCompliance, 'accept private shift offers'), 'neutral');
  }
}

function renderJobsiteOpenShifts(payload) {
  const shifts = Array.isArray(payload.data) ? payload.data : [];
  const rows = shifts.map((shift) => `
    <tr>
      <td>${escapeHtml(shift.id)}</td>
      <td>${escapeHtml(shift.title)}</td>
      <td>${escapeHtml(shift.companyName || shift.jobsiteName || 'Progress Staffing')}</td>
      <td>${escapeHtml(shift.schedule || '—')}</td>
    </tr>
  `);

  setTableRows('jobsiteOpenShifts', rows, 4, 'No open shifts are available right now.');
}

async function loadJobsiteOpenShifts() {
  const openShiftsEl = document.getElementById('jobsiteOpenShifts');
  if (!openShiftsEl) return;

  const res = await apiFetch('/api/shifts/open');
  if (!res.ok) {
    setTableRows('jobsiteOpenShifts', [], 4, 'Unable to load open shifts right now.');
    return;
  }

  const payload = await res.json();
  renderJobsiteOpenShifts(payload);
}

async function loadEmployeeShiftData() {
  const openShiftsEl = document.getElementById('employeeOpenShifts');
  const offersEl = document.getElementById('employeeShiftOffers');
  if (!openShiftsEl && !offersEl) return;

  const [openRes, offersRes] = await Promise.all([
    apiFetch('/api/shifts/open'),
    apiFetch('/api/shifts/offers'),
  ]);

  if (openRes.ok) {
    renderEmployeeOpenShifts(await openRes.json());
  } else {
    setTableRows('employeeOpenShifts', [], 6, 'Unable to load open shifts right now.');
  }

  if (offersRes.ok) {
    renderEmployeeShiftOffers(await offersRes.json());
  } else {
    setTableRows('employeeShiftOffers', [], 6, 'Unable to load shift offers right now.');
  }
}

async function loadEmployeeTimeClock() {
  const assignmentSelect = document.getElementById('employeeClockAssignment');
  const statusInput = document.getElementById('employeeClockStatusText');
  const clockInBtn = document.getElementById('employeeClockInBtn');
  const clockOutBtn = document.getElementById('employeeClockOutBtn');
  const clockMsg = document.getElementById('employeeClockMessage');
  const entriesTbodyId = 'employeeClockEntries';

  if (!assignmentSelect || !statusInput || !clockInBtn || !clockOutBtn) return;

  const res = await apiFetch('/api/portal/employee/timeclock');
  if (!res.ok) {
    statusInput.value = 'Unable to load clock status';
    clockInBtn.disabled = true;
    clockOutBtn.disabled = true;
    setTableRows(entriesTbodyId, [], 5, 'Unable to load punch history right now.');
    return;
  }

  const payload = await res.json();
  let assignments = Array.isArray(payload.assignments) ? payload.assignments : [];
  let activeEntry = payload.activeEntry || null;
  let entries = Array.isArray(payload.entries) ? payload.entries : [];

  // Safety feature: if user left geofence with an active punch, auto-clock-out.
  if (activeEntry) {
    try {
      const coords = await getCurrentDeviceCoordinates();
      const autoRes = await apiFetch('/api/portal/employee/timeclock/auto-clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }),
      });

      if (autoRes.ok) {
        const autoPayload = await autoRes.json().catch(() => ({}));
        if (autoPayload && autoPayload.autoClockedOut) {
          if (clockMsg) {
            setMessage(clockMsg, 'Auto clock-out applied: you were detected outside the jobsite geofence.', 'neutral');
          }

          const refreshRes = await apiFetch('/api/portal/employee/timeclock');
          if (refreshRes.ok) {
            const refreshed = await refreshRes.json().catch(() => ({}));
            assignments = Array.isArray(refreshed.assignments) ? refreshed.assignments : [];
            activeEntry = refreshed.activeEntry || null;
            entries = Array.isArray(refreshed.entries) ? refreshed.entries : [];
          }

          await loadEmployeeTimesheets();
        }
      }
    } catch (_error) {
      // Ignore geolocation/auto-clock-out failures and continue rendering.
    }
  }

  const previousSelection = String(assignmentSelect.value || '');
  assignmentSelect.innerHTML = '<option value="">Select assigned shift</option>';
  assignments.forEach((item) => {
    const option = document.createElement('option');
    option.value = String(item.id);
    const company = String(item.companyName || 'Progress Staffing');
    option.textContent = `${item.title || 'Shift'} - ${company}`;
    assignmentSelect.appendChild(option);
  });

  if (activeEntry && activeEntry.assignmentId) {
    assignmentSelect.value = String(activeEntry.assignmentId);
  } else if (previousSelection && assignmentSelect.querySelector(`option[value="${previousSelection}"]`)) {
    assignmentSelect.value = previousSelection;
  }

  if (activeEntry) {
    const company = String(activeEntry.companyName || 'Progress Staffing');
    const title = String(activeEntry.title || 'Shift');
    statusInput.value = `Clocked in: ${title} @ ${company} since ${formatDateTime(activeEntry.clockInAt)}`;
    clockInBtn.disabled = true;
    clockOutBtn.disabled = false;
  } else {
    statusInput.value = 'Not clocked in';
    clockInBtn.disabled = assignments.length === 0;
    clockOutBtn.disabled = true;
  }

  const rows = entries.map((entry) => {
    const inAt = parsePortalDateTime(entry.clockInAt);
    const outAt = parsePortalDateTime(entry.clockOutAt);
    const hasDuration = inAt && outAt && !Number.isNaN(inAt.getTime()) && !Number.isNaN(outAt.getTime());
    const durationHours = hasDuration
      ? ((outAt.getTime() - inAt.getTime()) / (1000 * 60 * 60)).toFixed(2)
      : '—';
    return `<tr><td>${escapeHtml(entry.title || '—')}</td><td>${escapeHtml(entry.companyName || 'Progress Staffing')}</td><td>${escapeHtml(formatDateTime(entry.clockInAt))}</td><td>${escapeHtml(formatDateTime(entry.clockOutAt))}</td><td>${escapeHtml(durationHours)}</td></tr>`;
  });
  setTableRows(entriesTbodyId, rows, 5, 'No punches recorded yet.');
}

// ─── Employee: Timesheet Submissions ────────────────────────────────────────

function renderEmployeeTimesheets(data) {
  const { timesheets = [], unsubmitted = [], assignments = [] } = data;
  employeeUnsubmittedClockEntries = Array.isArray(unsubmitted) ? unsubmitted.slice() : [];

  // Populate the submitted timesheets table
  const tsRows = timesheets.map((ts) => {
    const period = formatDateRange(ts.periodStart, ts.periodEnd);
    const statusCls = ts.status === 'approved' ? 'badge--green' : 'badge--yellow';
    const statusLabel = ts.status === 'approved' ? 'Approved' : 'Pending Approval';
    const badge = `<span class="badge ${statusCls}">${escapeHtml(statusLabel)}</span>`;
    const sourceLabel = ts.source === 'paper' ? 'Paper Upload' : ts.source === 'manual' ? 'Manual Entry' : 'Clock';
    const sourceBadgeCls = ts.source === 'paper' ? 'badge--gray' : ts.source === 'manual' ? 'badge--yellow' : 'badge--green';
    const sourceBadge = `<span class="badge ${sourceBadgeCls}">${escapeHtml(sourceLabel)}</span>`;
    const paperLink = ts.paperStoredName
      ? ` <a class="link" href="/api/portal/timesheets/${ts.id}/file" target="_blank" rel="noopener">View file</a>`
      : '';
    const sig = ts.approvedAt
      ? `${escapeHtml(ts.approvalSignature || '')} <span style="font-size:0.78rem;color:var(--color-muted)">(${escapeHtml(formatDateOnly(ts.approvedAt))})</span>`
      : '—';
    const submittedBy = ts.submittedBy === 'admin' ? 'Admin' : 'Employee';
    return `<tr><td>${period}</td><td>${escapeHtml(ts.jobTitle || '—')}${ts.statPayEnabled ? `<br>${statPayApprovalMarkup(ts)}` : ''}${paperLink}</td><td>${escapeHtml(ts.companyName || '—')}</td><td>${escapeHtml(String(ts.totalHours || 0))} hrs</td><td>${escapeHtml(submittedBy)}</td><td>${sourceBadge}</td><td>${badge}</td><td>${sig}</td></tr>`;
  });
  setTableRows('employeeTimesheetsTbody', tsRows, 8, 'No timesheets submitted yet.');

  // Populate assignment dropdown for weekly timesheet form
  const weeklyAssignSel = document.getElementById('employeeWeeklyAssignment');
  const optionsHtml = '<option value="">Select assignment…</option>' +
    assignments.map(a => `<option value="${a.id}" data-job-id="${a.jobId}" data-jobsite-user-id="${a.jobsiteUserId || ''}">${escapeHtml(a.title || `Assignment ${a.id}`)} — ${escapeHtml(a.companyName || 'Progress Staffing')}</option>`).join('');

  if (weeklyAssignSel) {
    const currentValue = weeklyAssignSel.value;
    weeklyAssignSel.innerHTML = optionsHtml;
    if (currentValue) weeklyAssignSel.value = currentValue;
  }

  autoPopulateWeeklyRowsFromClockEntries();
}

function renderWeeklyTimesheetEntryRow(dayIndex, dayLabel, dateStr, entryIndex, isMainRow) {
  const lunchName = `lunch_${dayIndex}_${entryIndex}`;
  const safeDate = String(dateStr || '').trim();
  const dateLabel = safeDate ? formatDateOnly(safeDate) : 'No date selected';
  return `<tr class="ts-entry-row ${isMainRow ? 'ts-entry-row--main' : 'ts-entry-row--extra'}" data-day-index="${dayIndex}" data-entry-index="${entryIndex}" data-date="${dateStr}">
    <td style="white-space:nowrap;font-size:0.88rem;">
      <div class="ts-date-cell">
        <span class="ts-date-text">${dateLabel}</span>
        <div class="ts-date-actions">
          <button type="button" class="ts-date-btn" data-open-date="1">Select date</button>
          <button type="button" class="ts-date-btn ts-date-btn--danger" data-delete-row="1">Delete row</button>
        </div>
        <input type="date" class="ts-date-input" value="${safeDate}" />
      </div>
    </td>
    <td><input type="text" class="ts-day-start" data-day="${dayIndex}" data-entry="${entryIndex}" style="width:100%;min-width:105px;" placeholder="h:mm AM/PM" autocomplete="off" /></td>
    <td><input type="text" class="ts-day-end" data-day="${dayIndex}" data-entry="${entryIndex}" style="width:100%;min-width:105px;" placeholder="h:mm AM/PM" autocomplete="off" /></td>
    <td>
      <div class="ts-lunch-group">
        <label class="ts-lunch-label"><input type="radio" data-lunch-choice="1" name="${lunchName}" value="15" /> 15 min</label>
        <label class="ts-lunch-label"><input type="radio" data-lunch-choice="1" name="${lunchName}" value="30" checked /> 30 min</label>
        <label class="ts-lunch-label ts-lunch-1hr" data-day="${dayIndex}" data-entry="${entryIndex}" hidden><input type="radio" data-lunch-choice="1" name="${lunchName}" value="60" /> 1 hr</label>
        <label class="ts-lunch-label"><input type="checkbox" class="ts-no-break" /> No break</label>
      </div>
      <div class="ts-no-break-reason-wrap" hidden>
        <input type="text" class="ts-no-break-reason" placeholder="Reason no break was taken" maxlength="500" />
      </div>
    </td>
    <td class="ts-day-hours" data-day="${dayIndex}" data-entry="${entryIndex}" style="white-space:nowrap;font-size:0.88rem;">—</td>
  </tr>`;
}

function syncNoBreakState(row) {
  if (!row) return;
  const noBreakCb = row.querySelector('.ts-no-break');
  const reasonWrap = row.querySelector('.ts-no-break-reason-wrap');
  const reasonInput = row.querySelector('.ts-no-break-reason');
  const radios = Array.from(row.querySelectorAll('input[data-lunch-choice="1"]'));
  const noBreak = Boolean(noBreakCb && noBreakCb.checked);

  if (noBreak) {
    radios.forEach((radio) => {
      radio.checked = false;
    });
  } else if (!radios.some((radio) => radio.checked)) {
    const defaultLunch = row.querySelector('input[data-lunch-choice="1"][value="30"]');
    if (defaultLunch) defaultLunch.checked = true;
  }

  if (reasonWrap) reasonWrap.hidden = !noBreak;
  if (!noBreak && reasonInput) reasonInput.value = '';
}

function updateWeeklyEntryHours(row) {
  if (!row) return null;
  const startEl = row.querySelector('.ts-day-start');
  const endEl = row.querySelector('.ts-day-end');
  const hoursEl = row.querySelector('.ts-day-hours');
  const oneHrLabel = row.querySelector('.ts-lunch-1hr');
  if (!startEl || !endEl || !hoursEl) return null;

  const start = startEl.value;
  const end = endEl.value;
  if (!start || !end) {
    hoursEl.textContent = '—';
    if (oneHrLabel) oneHrLabel.hidden = true;
    return null;
  }

  const start24 = parseUsTimeTo24(start);
  const end24 = parseUsTimeTo24(end);
  if (!start24 || !end24) {
    hoursEl.textContent = '—';
    if (oneHrLabel) oneHrLabel.hidden = true;
    return null;
  }

  const [sh, sm] = start24.split(':').map(Number);
  const [eh, em] = end24.split(':').map(Number);
  let totalMins = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMins <= 0) totalMins += 24 * 60;
  const rawHours = Math.round((totalMins / 60) * 100) / 100;

  const checkedLunch = row.querySelector('input[data-lunch-choice="1"]:checked');
  const noBreak = Boolean(row.querySelector('.ts-no-break') && row.querySelector('.ts-no-break').checked);
  const lunchMins = noBreak ? 0 : (checkedLunch ? Number(checkedLunch.value) : 30);
  const netHours = Math.max(0, Math.round((rawHours - lunchMins / 60) * 100) / 100);
  hoursEl.textContent = `${netHours} hrs`;

  const show1hr = rawHours >= 12 && rawHours <= 16;
  if (oneHrLabel) {
    oneHrLabel.hidden = !show1hr;
    if (!show1hr) {
      const oneHrRadio = oneHrLabel.querySelector('input[type="radio"]');
      if (oneHrRadio && oneHrRadio.checked) {
        const thirtyRadio = row.querySelector('input[data-lunch-choice="1"][value="30"]');
        if (thirtyRadio) thirtyRadio.checked = true;
      }
    }
  }
  return netHours;
}

function addWeeklyRowForDay(dayIndex) {
  const tbody = document.getElementById('employeeWeeklyTsDaysTbody');
  if (!tbody) return;
  const dayRows = Array.from(tbody.querySelectorAll(`tr.ts-entry-row[data-day-index="${dayIndex}"]`));
  if (!dayRows.length) return;

  const dateStr = String(dayRows[0].dataset.date || '');
  const nextEntryIndex = dayRows.reduce((max, row) => Math.max(max, Number(row.dataset.entryIndex || 0)), -1) + 1;
  const newRowHtml = renderWeeklyTimesheetEntryRow(dayIndex, '', dateStr, nextEntryIndex, false);
  dayRows[dayRows.length - 1].insertAdjacentHTML('afterend', newRowHtml);
}

function deleteWeeklyRow(row) {
  const tbody = document.getElementById('employeeWeeklyTsDaysTbody');
  if (!tbody || !row) return;

  const allRows = Array.from(tbody.querySelectorAll('tr.ts-entry-row'));
  if (allRows.length <= 1) {
    // Keep at least one row visible; clear it instead of removing it.
    row.dataset.date = '';
    const dateText = row.querySelector('.ts-date-text');
    if (dateText) dateText.textContent = 'No date selected';
    const dateInput = row.querySelector('.ts-date-input');
    if (dateInput) dateInput.value = '';
    const startEl = row.querySelector('.ts-day-start');
    const endEl = row.querySelector('.ts-day-end');
    if (startEl) startEl.value = '';
    if (endEl) endEl.value = '';
    const lunchDefault = row.querySelector('input[data-lunch-choice="1"][value="30"]');
    if (lunchDefault) lunchDefault.checked = true;
    const noBreakCb = row.querySelector('.ts-no-break');
    if (noBreakCb) noBreakCb.checked = false;
    const noBreakReason = row.querySelector('.ts-no-break-reason');
    if (noBreakReason) noBreakReason.value = '';
    syncNoBreakState(row);
    const oneHrLabel = row.querySelector('.ts-lunch-1hr');
    if (oneHrLabel) oneHrLabel.hidden = true;
    const hoursEl = row.querySelector('.ts-day-hours');
    if (hoursEl) hoursEl.textContent = '—';
    return;
  }

  row.remove();
}

function buildWeeklyTimesheetRows(periodStart) {
  const tbody = document.getElementById('employeeWeeklyTsDaysTbody');
  if (!tbody) return;

  const defaultDate = periodStart ? String(periodStart).trim() : '';
  tbody.innerHTML = renderWeeklyTimesheetEntryRow(0, '', defaultDate, 0, true);

  if (tbody.dataset.bound !== '1') {
    tbody.dataset.bound = '1';

    tbody.addEventListener('click', (event) => {
      const deleteBtn = event.target.closest('[data-delete-row="1"]');
      if (deleteBtn) {
        const row = deleteBtn.closest('tr.ts-entry-row');
        deleteWeeklyRow(row);
        return;
      }

      const openBtn = event.target.closest('[data-open-date="1"]');
      if (!openBtn) return;
      const row = openBtn.closest('tr.ts-entry-row');
      if (row) tbody.dataset.activeDay = String(row.dataset.dayIndex || '0');
      const dateInput = row ? row.querySelector('.ts-date-input') : null;
      if (!dateInput) return;
      if (typeof dateInput.showPicker === 'function') {
        dateInput.showPicker();
      } else {
        dateInput.click();
      }
    });

    tbody.addEventListener('focusin', (event) => {
      const row = event.target.closest('tr.ts-entry-row');
      if (!row) return;
      tbody.dataset.activeDay = String(row.dataset.dayIndex || '0');
    });

    tbody.addEventListener('change', (event) => {
      const target = event.target;
      if (target.matches('.ts-date-input')) {
        const row = target.closest('tr.ts-entry-row');
        if (!row) return;
        const newDate = String(target.value || '').trim();
        row.dataset.date = newDate;
        const dateText = row.querySelector('.ts-date-text');
        if (dateText) dateText.textContent = newDate ? formatDateOnly(newDate) : 'No date selected';

        // Auto-fill start/end from a matching unsubmitted clock entry
        if (newDate && Array.isArray(employeeUnsubmittedClockEntries) && employeeUnsubmittedClockEntries.length) {
          const assignmentEl = document.getElementById('employeeWeeklyAssignment');
          const assignmentId = assignmentEl ? Number(assignmentEl.value) : 0;

          // Collect clock entry IDs already used in other rows
          const usedIds = new Set(
            Array.from(tbody.querySelectorAll('tr.ts-entry-row'))
              .filter(r => r !== row)
              .map(r => String(r.dataset.clockEntryId || ''))
              .filter(Boolean)
          );

          const match = employeeUnsubmittedClockEntries.find(entry => {
            if (!entry.clockInAt || !entry.clockOutAt) return false;
            if (usedIds.has(String(entry.id))) return false;
            if (assignmentId > 0 && Number(entry.assignmentId) !== assignmentId) return false;
            return toLocalDateYmd(entry.clockInAt) === newDate;
          });

          if (match) {
            const startInput = row.querySelector('.ts-day-start');
            const endInput = row.querySelector('.ts-day-end');
            if (startInput && !startInput.value) startInput.value = toLocalTimeFromIso(match.clockInAt);
            if (endInput && !endInput.value) endInput.value = toLocalTimeFromIso(match.clockOutAt);
            row.dataset.clockEntryId = String(match.id);
            updateWeeklyEntryHours(row);
          }
        }
        return;
      }

      if (target.matches('.ts-day-start, .ts-day-end, input[data-lunch-choice="1"]')) {
        const row = target.closest('tr.ts-entry-row');
        if (target.matches('.ts-day-start, .ts-day-end')) {
          normalizeTimeInputDisplay(target);
        }
        if (target.matches('input[data-lunch-choice="1"]') && row) {
          const noBreakCb = row.querySelector('.ts-no-break');
          if (noBreakCb && noBreakCb.checked) {
            noBreakCb.checked = false;
            syncNoBreakState(row);
          }
        }
        if (row) tbody.dataset.activeDay = String(row.dataset.dayIndex || '0');
        updateWeeklyEntryHours(row);
      }

      if (target.matches('.ts-no-break')) {
        const row = target.closest('tr.ts-entry-row');
        syncNoBreakState(row);
        updateWeeklyEntryHours(row);
      }
    });

    tbody.addEventListener('focusout', (event) => {
      const target = event.target;
      if (target && target.matches && target.matches('.ts-day-start, .ts-day-end')) {
        normalizeTimeInputDisplay(target);
      }
    });

    const addRowBtn = document.getElementById('employeeWeeklyAddRowBtn');
    if (addRowBtn && addRowBtn.dataset.bound !== '1') {
      addRowBtn.dataset.bound = '1';
      addRowBtn.addEventListener('click', () => {
        const activeDay = Number(tbody.dataset.activeDay || '0');
        addWeeklyRowForDay(Number.isInteger(activeDay) ? activeDay : 0);
      });
    }
  }

  // Default active day is Monday whenever the week is rebuilt.
  tbody.dataset.activeDay = '0';
}

function toLocalTimeFromIso(isoValue) {
  const date = parsePortalDateTime(isoValue);
  if (!date) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return format24ToUsTime(`${hh}:${mm}`);
}

function autoPopulateWeeklyRowsFromClockEntries() {
  const tbody = document.getElementById('employeeWeeklyTsDaysTbody');
  const assignmentEl = document.getElementById('employeeWeeklyAssignment');
  const periodStartEl = document.getElementById('employeeWeeklyPeriodStart');
  const periodEndEl = document.getElementById('employeeWeeklyPeriodEnd');
  if (!tbody || !assignmentEl || !periodStartEl || !periodEndEl) return;

  let assignmentId = Number(assignmentEl.value);
  if (!Number.isInteger(assignmentId) || assignmentId < 1) {
    const latestAny = employeeUnsubmittedClockEntries
      .filter((entry) => entry && entry.clockInAt && entry.clockOutAt && Number.isInteger(Number(entry.assignmentId)))
      .sort((a, b) => String(b.clockInAt || '').localeCompare(String(a.clockInAt || '')))[0];
    if (!latestAny) return;
    assignmentId = Number(latestAny.assignmentId);
    if (assignmentEl.querySelector(`option[value="${assignmentId}"]`)) {
      assignmentEl.value = String(assignmentId);
    }
  }

  let periodStart = String(periodStartEl.value || '').trim();
  let periodEnd = String(periodEndEl.value || '').trim();

  if (!periodStart || !periodEnd) {
    const latestForAssignment = employeeUnsubmittedClockEntries
      .filter((entry) => Number(entry.assignmentId) === assignmentId && entry.clockInAt && entry.clockOutAt)
      .sort((a, b) => String(b.clockInAt || '').localeCompare(String(a.clockInAt || '')))[0];
    if (!latestForAssignment) return;

    const referenceDate = parsePortalDateTime(latestForAssignment.clockInAt);
    if (!referenceDate) return;
    const day = referenceDate.getDay(); // 0=Sun,1=Mon
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(referenceDate);
    monday.setDate(referenceDate.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    periodStart = monday.toISOString().slice(0, 10);
    periodEnd = sunday.toISOString().slice(0, 10);
    periodStartEl.value = periodStart;
    periodEndEl.value = periodEnd;
    buildWeeklyTimesheetRows(periodStart);
  }

  if (!periodStart || !periodEnd) return;

  const matchingEntries = employeeUnsubmittedClockEntries
    .filter((entry) => {
      if (Number(entry.assignmentId) !== assignmentId) return false;
      if (!entry.clockInAt || !entry.clockOutAt) return false;
      const entryDate = toLocalDateYmd(entry.clockInAt);
      return entryDate >= periodStart && entryDate <= periodEnd;
    })
    .sort((a, b) => String(a.clockInAt || '').localeCompare(String(b.clockInAt || '')));

  if (!matchingEntries.length) return;

  tbody.innerHTML = matchingEntries.map((entry, idx) => {
    const date = toLocalDateYmd(entry.clockInAt);
    return renderWeeklyTimesheetEntryRow(idx, '', date, idx, idx === 0);
  }).join('');

  const rows = Array.from(tbody.querySelectorAll('tr.ts-entry-row'));
  rows.forEach((row, idx) => {
    const entry = matchingEntries[idx];
    if (!entry) return;
    row.dataset.clockEntryId = String(entry.id || '');

    const startInput = row.querySelector('.ts-day-start');
    const endInput = row.querySelector('.ts-day-end');
    if (startInput) startInput.value = toLocalTimeFromIso(entry.clockInAt);
    if (endInput) endInput.value = toLocalTimeFromIso(entry.clockOutAt);
    updateWeeklyEntryHours(row);
  });

  tbody.dataset.activeDay = '0';
}

async function loadEmployeeTimesheets() {
  const res = await apiFetch('/api/portal/employee/timesheets');
  if (!res.ok) return;
  const data = await res.json().catch(() => ({}));
  renderEmployeeTimesheets(data);
}

// ─── Jobsite: Timesheet Approvals ────────────────────────────────────────────

function renderJobsiteTimesheets(data) {
  const { timesheets = [] } = data;

  const rows = timesheets.map(ts => {
    const period = formatDateRange(ts.periodStart, ts.periodEnd);
    const statusCls = ts.status === 'approved' ? 'badge--green' : 'badge--yellow';
    const statusLabel = ts.status === 'approved' ? 'Approved' : 'Pending Approval';
    const badge = `<span class="badge ${statusCls}">${escapeHtml(statusLabel)}</span>`;
    const submittedBy = ts.submittedBy === 'admin' ? 'Admin' : 'Employee';
    const sourceLabel = ts.source === 'paper' ? 'Paper Upload' : ts.source === 'manual' ? 'Manual Entry' : 'Clock';
    const sourceBadgeCls = ts.source === 'paper' ? 'badge--gray' : ts.source === 'manual' ? 'badge--yellow' : 'badge--green';
    const sourceBadge = `<span class="badge ${sourceBadgeCls}">${escapeHtml(sourceLabel)}</span>`;
    const reviewBtn = `<button class="button button--ghost button--sm" type="button" data-review-ts-id="${ts.id}">Review</button>`;
    return `<tr>
      <td>${escapeHtml(ts.employeeName || '—')}</td>
      <td>${escapeHtml(ts.employeePosition || '—')}</td>
      <td>${period}${ts.statPayEnabled ? `<br>${statPayApprovalMarkup(ts)}` : ''}</td>
      <td>${escapeHtml(String(ts.totalHours || 0))} hrs</td>
      <td>${escapeHtml(submittedBy)}</td>
      <td>${sourceBadge}</td>
      <td>${badge}</td>
      <td>${reviewBtn}</td>
    </tr>`;
  });
  setTableRows('jobsiteTimesheetsTbody', rows, 8, 'No timesheets to review.');

  // Store timesheets for review panel
  const section = document.getElementById('jobsiteTimesheetSection');
  if (section) section._timesheets = timesheets;
}

function showJobsiteTimesheetReview(ts) {
  const panel = document.getElementById('jobsiteTimesheetReviewPanel');
  const titleEl = document.getElementById('jobsiteTimesheetReviewTitle');
  const metaEl = document.getElementById('jobsiteTimesheetReviewMeta');
  const entriesTbody = document.getElementById('jobsiteTimesheetEntriesTbody');
  const approvedBadge = document.getElementById('jobsiteTimesheetReviewApprovedBadge');
  const approveForm = document.getElementById('jobsiteTimesheetApproveForm');
  const approveBtn = document.getElementById('jobsiteTimesheetApproveBtn');
  const approvedDetail = document.getElementById('jobsiteTimesheetApprovedDetail');
  const sigInput = document.getElementById('jobsiteApprovalSignature');
  const approveMsg = document.getElementById('jobsiteTimesheetApproveMessage');

  if (!panel) return;

  if (titleEl) titleEl.textContent = `Timesheet Review — ${ts.employeeName || 'Employee'}`;
  if (approveMsg) hideMessage(approveMsg);
  if (sigInput) sigInput.value = '';

  if (metaEl) {
    const sourceLabel = ts.source === 'paper' ? 'Paper Upload' : ts.source === 'manual' ? 'Manual Entry' : 'Clock In / Out';
    const paperFileLink = ts.paperFileUrl
      ? `<div style="grid-column:1/-1;"><span style="color:var(--color-muted);">Paper Timesheet</span><br><a class="link" href="${escapeHtml(ts.paperFileUrl)}" target="_blank" rel="noopener">${escapeHtml(ts.paperOriginalName || 'View uploaded file')}</a></div>`
      : '';
    metaEl.innerHTML = `
      <div><span style="color:var(--color-muted);">Employee</span><br><strong>${escapeHtml(ts.employeeName || '—')}</strong></div>
      <div><span style="color:var(--color-muted);">Position</span><br><strong>${escapeHtml(ts.employeePosition || '—')}</strong></div>
      <div><span style="color:var(--color-muted);">Shift</span><br><strong>${escapeHtml(ts.jobTitle || '—')}</strong></div>
      <div><span style="color:var(--color-muted);">Facility</span><br><strong>${escapeHtml(ts.facilityName || '—')}</strong></div>
      <div style="grid-column:1/-1;"><span style="color:var(--color-muted);">Street Address</span><br><strong>${escapeHtml(ts.facilityAddress || '—')}</strong></div>
      <div><span style="color:var(--color-muted);">Period</span><br><strong>${escapeHtml(formatDateRange(ts.periodStart, ts.periodEnd))}</strong></div>
      <div><span style="color:var(--color-muted);">Total Hours</span><br><strong>${escapeHtml(String(ts.totalHours || 0))} hrs</strong></div>
      <div><span style="color:var(--color-muted);">Submitted By</span><br><strong>${ts.submittedBy === 'admin' ? 'Admin' : 'Employee'}</strong></div>
      <div><span style="color:var(--color-muted);">Source</span><br><strong>${escapeHtml(sourceLabel)}</strong></div>
      ${paperFileLink}
      ${ts.notes ? `<div style="grid-column:1/-1;"><span style="color:var(--color-muted);">Notes</span><br>${escapeHtml(ts.notes)}</div>` : ''}
    `;
  }

  // Parse and render entries
  let entries = [];
  try { entries = JSON.parse(ts.entriesJson || '[]'); } catch {}
  if (entriesTbody) {
    entriesTbody.innerHTML = entries.map((e, i) => {
      const inAt = e.clockIn || '—';
      const outAt = e.clockOut || '—';
      const type = e.type === 'manual'
        ? '<span class="badge badge--yellow">Manual</span>'
        : e.type === 'paper'
          ? '<span class="badge badge--gray">Paper</span>'
          : '<span class="badge badge--green">Clock</span>';
      return `<tr><td>${i + 1}</td><td>${escapeHtml(e.date ? formatDateOnly(e.date) : formatDateOnly(inAt))}</td><td>${escapeHtml(formatDateTime(inAt))}</td><td>${escapeHtml(formatDateTime(outAt))}</td><td>${escapeHtml(String(e.hours || 0))} hrs</td><td>${type}</td></tr>`;
    }).join('') || '<tr><td colspan="6">No entries.</td></tr>';
  }

  if (ts.status === 'approved') {
    if (approvedBadge) approvedBadge.style.display = 'block';
    if (approvedDetail) approvedDetail.textContent = `Signed: ${ts.approvalSignature || ''} on ${ts.approvedAt ? formatDateOnly(ts.approvedAt) : ''}`;
    if (approveForm) approveForm.style.display = 'none';
  } else {
    if (approvedBadge) approvedBadge.style.display = 'none';
    if (approveForm) approveForm.style.display = 'block';
    if (approveBtn) approveBtn.dataset.timesheetId = ts.id;
  }

  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function loadJobsiteTimesheets() {
  const res = await apiFetch('/api/portal/jobsite/timesheets');
  if (!res.ok) return;
  const data = await res.json().catch(() => ({}));
  renderJobsiteTimesheets(data);
}

async function loadEmployeePortalData(currentUser) {
  await loadEmployeeDashboard(currentUser);
  await Promise.all([
    loadEmployeeShiftData(),
    loadEmployeeTimeClock(),
    loadEmployeeTimesheets(),
    loadPortalMessages(),
  ]);
  apiFetch('/api/portal/employee/ncns-assignments').then(r => r.json()).then(payload => {
    renderEmployeeNcnsAssignments(Array.isArray(payload.data) ? payload.data : []);
  }).catch(() => {});
}

async function bindNotificationControls() {
  const button = document.getElementById('portalNotificationEnableBtn');
  const status = document.getElementById('portalNotificationStatus');
  if (!status) return;

  // Determine label context by page
  const pageType = document.body.dataset.portalPage;
  const descriptionEl = document.getElementById('portalNotificationDescription');
  if (descriptionEl) {
    if (pageType === 'admin') {
      descriptionEl.textContent = 'Enable browser notifications to receive live alerts for contracts, employee documents, messages, and other admin tasks.';
    } else if (pageType === 'jobsite') {
      descriptionEl.textContent = t('notifications.clientDescription');
    } else if (pageType === 'employee' && employeeOnboardingStatus !== 'active') {
      descriptionEl.textContent = getEmployeeOnboardingBlockMessage(employeeCompliance, 'enable shift notifications');
    } else {
      descriptionEl.textContent = t('notifications.employeeActiveDescription');
    }
  }

  const registration = await registerPortalServiceWorker();
  if (!registration) {
    setMessage(status, t('notifications.unavailable'), 'error');
    if (button) button.disabled = true;
    return;
  }

  async function syncSubscriptionState() {
    if (pageType === 'employee' && employeeOnboardingStatus !== 'active') {
      setMessage(status, `Status: Registered. ${getEmployeeOnboardingBlockMessage(employeeCompliance, 'enable shift notifications')}`, 'neutral');
      if (button) {
        button.disabled = true;
        button.textContent = t('notifications.pendingApproval');
      }
      return;
    }

    const permission = Notification.permission;
    if (permission === 'denied') {
      setMessage(status, t('notifications.blocked'), 'error');
      if (button) button.disabled = true;
      return;
    }

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      if (pageType === 'employee' && employeeOnboardingStatus === 'active') {
        setMessage(status, t('notifications.employeeEnabled'), 'success');
      } else {
        setMessage(status, t('notifications.enabled'), 'success');
      }
      if (button) {
        button.textContent = t('notifications.enabledButton');
        button.disabled = true;
      }
      return;
    }

    hideMessage(status);
    if (button) {
      button.disabled = false;
      button.textContent = t('common.enablePushNotifications');
    }
  }

  await syncSubscriptionState();

  if (!button) return;

  button.addEventListener('click', async () => {
    hideMessage(status);
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setMessage(status, t('notifications.permissionDenied'), 'error');
      return;
    }

    const keyRes = await apiFetch('/api/notifications/vapid-public-key');
    const keyPayload = await keyRes.json().catch(() => ({}));
    if (!keyRes.ok || !keyPayload.publicKey) {
      setMessage(status, keyPayload.error || 'Push notifications are not configured on the server.', 'error');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyPayload.publicKey),
    });

    const res = await apiFetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(status, payload.error || t('notifications.subscriptionFailed'), 'error');
      return;
    }

    setMessage(status, t('notifications.deviceEnabled'), 'success');
    button.textContent = t('notifications.enabledButton');
    button.disabled = true;
  });
}

async function handlePortalMessageSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.sending === '1') return;
  const status = document.getElementById('portalMessageStatus');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnLabel = submitBtn ? submitBtn.textContent : '';
  hideMessage(status);

  const recipientValue = String(form.recipientUserId.value || '').trim();
  const sendToAllEmployees = recipientValue === 'all-employees';
  const sendToAllClients = recipientValue === 'all-clients';
  const recipientUserId = (sendToAllEmployees || sendToAllClients) ? null : asInt(recipientValue);
  const body = form.body.value.trim();

  if (!sendToAllEmployees && !sendToAllClients && (!Number.isInteger(recipientUserId) || recipientUserId < 1)) {
    setMessage(status, t('messaging.invalidRecipient'), 'error');
    return;
  }

  if (!body) {
    setMessage(status, t('messaging.messageRequired'), 'error');
    return;
  }

  const requestPayload = sendToAllEmployees
    ? { recipientUserId: 'all-employees', recipientGroup: 'employees', body }
    : sendToAllClients
      ? { recipientUserId: 'all-clients', recipientGroup: 'clients', body }
      : { recipientUserId, body };

  form.dataset.sending = '1';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = t('messaging.sending');
  }

  try {
    const res = await apiFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(status, payload.error || 'Failed to send message.', 'error');
      return;
    }

    const successText = sendToAllEmployees
      ? `Message sent to ${payload.sentCount || 0} employees.`
      : sendToAllClients
        ? `Message sent to ${payload.sentCount || 0} clients.`
        : t('messaging.sent');
    const finalSuccessText = payload.redacted
      ? `${successText} Some wording was filtered for safety.`
      : successText;
    setMessage(status, finalSuccessText, 'success');
    form.body.value = '';
    if (!sendToAllEmployees && !sendToAllClients) form.recipientUserId.value = '';
    await loadPortalMessages();
  } finally {
    delete form.dataset.sending;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnLabel || 'Send Message';
    }
  }
}

function bindPortalMessaging() {
  const form = document.getElementById('portalMessageForm');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  form.addEventListener('submit', handlePortalMessageSubmit);

  const recipientSelect = document.getElementById('portalMessageRecipient');
  if (recipientSelect && recipientSelect.dataset.bound !== '1') {
    recipientSelect.dataset.bound = '1';
    recipientSelect.addEventListener('change', () => {
      const selectedId = asInt(recipientSelect.value);
      if (Number.isInteger(selectedId) && selectedId > 0) {
        portalSelectedThreadUserId = selectedId;
        refreshPortalMessagesLive(true);
      } else if (!recipientSelect.value) {
        portalSelectedThreadUserId = -1;
        refreshPortalMessagesLive(true);
      }
    });
  }

  const list = document.getElementById('portalMessagesList');
  if (list && list.dataset.bound !== '1') {
    list.dataset.bound = '1';
    list.addEventListener('click', async (event) => {
      const replyBtn = event.target.closest('[data-reply-user-id]');
      if (replyBtn) {
        const replyUserId = asInt(replyBtn.dataset.replyUserId);
        if (!Number.isInteger(replyUserId) || replyUserId < 1) return;
        preparePortalMessageReply(replyUserId, replyBtn.dataset.replyUserName || '');
        return;
      }

      const deleteBtn = event.target.closest('[data-delete-message-id]');
      if (!deleteBtn) return;
      const messageId = asInt(deleteBtn.dataset.deleteMessageId);
      if (!Number.isInteger(messageId) || messageId < 1) return;

      const status = document.getElementById('portalMessageStatus');
      const res = await apiFetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(status, payload.error || t('messaging.deleteFailed'), 'error');
        return;
      }

      setMessage(status, t('messaging.deleted'), 'success');
      await loadPortalMessages();
    });
  }

  startPortalMessageLiveSync();
}

async function handlePortalAccountSubmit(event, endpoint = '/api/account') {
  event.preventDefault();
  const form = event.currentTarget;
  const msg = form.querySelector('.form-message');
  hideMessage(msg);

  const payload = {
    name: form.name ? String(form.name.value || '').trim() : undefined,
    phone: form.phone ? String(form.phone.value || '').trim() : undefined,
    address: form.address ? String(form.address.value || '').trim() : undefined,
    city: form.city ? String(form.city.value || '').trim() : undefined,
    state: form.state ? String(form.state.value || '').trim().toUpperCase() : undefined,
    zip: form.zip ? String(form.zip.value || '').trim() : undefined,
    skills: form.skills ? String(form.skills.value || '').trim() : undefined,
    certifications: form.certifications ? String(form.certifications.value || '').trim() : undefined,
    companyName: form.companyName ? String(form.companyName.value || '').trim() : undefined,
    contactName: form.contactName ? String(form.contactName.value || '').trim() : undefined,
    currentCredential: form.currentCredential.value,
    newEmail: form.newEmail ? form.newEmail.value.trim() : '',
    newPassword: form.newPassword ? form.newPassword.value : '',
    newPasscode: form.newPasscode ? form.newPasscode.value.trim() : '',
    removePasscode: form.removePasscode ? form.removePasscode.checked : false,
    requireBiometricSensitive: form.requireBiometricSensitive ? form.requireBiometricSensitive.checked : undefined,
  };

  const sensitiveToggleChanged = Boolean(
    form.requireBiometricSensitive
    && (form.requireBiometricSensitive.dataset.initialValue || '0') !== (form.requireBiometricSensitive.checked ? '1' : '0')
  );

  if (!payload.currentCredential) {
    setMessage(msg, t('account.currentCredentialRequired'), 'error');
    return;
  }

  const hasProfileChange = [
    payload.name,
    payload.phone,
    payload.address,
    payload.city,
    payload.state,
    payload.zip,
    payload.skills,
    payload.certifications,
    payload.companyName,
    payload.contactName,
  ].some((value) => value !== undefined && value !== '');

  if (!payload.newEmail && !payload.newPassword && !payload.newPasscode && !payload.removePasscode && !sensitiveToggleChanged && !hasProfileChange) {
    setMessage(msg, t('account.noChanges'), 'error');
    return;
  }

  if (payload.name !== undefined && payload.name && payload.name.length < 2) {
    setMessage(msg, t('account.fullNameRequired'), 'error');
    return;
  }

  if (payload.newPassword && payload.newPassword.length < 8) {
    setMessage(msg, t('account.passwordMin'), 'error');
    return;
  }

  if (payload.newPasscode && !/^\d{4}$/.test(payload.newPasscode)) {
    setMessage(msg, t('account.passcodeInvalid'), 'error');
    return;
  }

  const normalizedPhone = payload.phone !== undefined ? phoneDigits(payload.phone) : '';
  if (payload.phone && normalizedPhone.length !== 10) {
    setMessage(msg, t('account.phoneInvalid'), 'error');
    return;
  }

  const hasAddressData = Boolean(payload.address || payload.city || payload.state || payload.zip);
  if (hasAddressData && (!payload.address || !payload.city || !payload.state || !payload.zip)) {
    setMessage(msg, t('account.addressRequired'), 'error');
    return;
  }

  if (payload.state && !/^[A-Z]{2}$/.test(payload.state)) {
    setMessage(msg, t('account.stateInvalid'), 'error');
    return;
  }

  if (payload.zip && !/^\d{5}(?:-\d{4})?$/.test(payload.zip)) {
    setMessage(msg, t('account.zipInvalid'), 'error');
    return;
  }

  if (form.companyName && !payload.companyName) {
    setMessage(msg, t('account.companyNameRequired'), 'error');
    return;
  }

  if (form.contactName && !payload.contactName) {
    setMessage(msg, t('account.contactNameRequired'), 'error');
    return;
  }

  if (payload.phone !== undefined) {
    payload.phone = normalizedPhone;
  }

  const res = await apiFetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const response = await res.json().catch(() => ({}));
  if (!res.ok) {
    setMessage(msg, response.error || 'Failed to save account settings.', 'error');
    return;
  }

  const successText = response && response.emailChangePending && response.pendingEmail
    ? t('account.savedPendingEmail', { email: response.pendingEmail })
    : response.passcodeEnabled
      ? t('account.savedPasscode')
      : t('account.saved');
  setMessage(msg, successText, 'success');

  if (!portalCurrentUser) portalCurrentUser = {};
  if (response && response.name) portalCurrentUser.name = response.name;
  if (response && response.email) portalCurrentUser.email = response.email;
  portalCurrentUser.pendingEmail = response && response.pendingEmail ? response.pendingEmail : null;
  if (response && response.preferredLanguage) {
    portalCurrentUser.preferredLanguage = response.preferredLanguage;
    setPortalDocumentLanguage(response.preferredLanguage);
  }
  if (!portalCurrentUser.securityPreferences) portalCurrentUser.securityPreferences = {};
  const nextSensitive = response
    && response.securityPreferences
    && response.securityPreferences.requireBiometricSensitive === true;
  portalCurrentUser.securityPreferences.requireBiometricSensitive = nextSensitive;

  if (form.requireBiometricSensitive) {
    form.requireBiometricSensitive.dataset.initialValue = nextSensitive ? '1' : '0';
  }

  const profileForPopulate = response && response.profile
    ? response.profile
    : {
        phone: form.phone ? phoneDigits(form.phone.value) : undefined,
        address: form.address ? form.address.value : undefined,
        city: form.city ? form.city.value : undefined,
        state: form.state ? form.state.value : undefined,
        zip: form.zip ? form.zip.value : undefined,
        skills: form.skills ? form.skills.value : undefined,
        certifications: form.certifications ? form.certifications.value : undefined,
        companyName: form.companyName ? form.companyName.value : undefined,
        contactName: form.contactName ? form.contactName.value : undefined,
      };
  populateAccountIdentityFields(portalCurrentUser, { profile: profileForPopulate });
  applyPortalStaticTranslations();
  await refreshPasskeyStatus(form).catch(() => {});
  form.currentCredential.value = '';
  if (form.newPassword) form.newPassword.value = '';
  if (form.newPasscode) form.newPasscode.value = '';
  if (form.removePasscode) form.removePasscode.checked = false;

  const pageType = String(document.body?.dataset?.portalPage || '').trim().toLowerCase();
  if (pageType === 'employee' && portalCurrentUser) {
    await loadEmployeeDashboard(portalCurrentUser);
  }
  if (pageType === 'jobsite' && portalCurrentUser) {
    await loadJobsiteDashboard(portalCurrentUser);
  }
}

function bindPortalAccountForm(formId = 'portalAccountForm', endpoint = '/api/account') {
  const form = document.getElementById(formId);
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  form.addEventListener('submit', (event) => handlePortalAccountSubmit(event, endpoint));
  bindPasskeyAccountControls(form);
}

function populateEmployeeRegistrationPositions(trackSelect, positionSelect, selectedIndustry = '', selectedPosition = '') {
  if (!trackSelect || !positionSelect) return;

  const options = EMPLOYEE_REGISTRATION_OPTIONS[trackSelect.value] || [];
  positionSelect.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = options.length ? 'Select position' : 'Select industry first';
  positionSelect.appendChild(placeholder);

  options.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.position;
    option.textContent = item.position;
    option.dataset.industry = item.industry;
    positionSelect.appendChild(option);
  });

  const nextValue = options.find(
    (item) => item.industry === selectedIndustry && item.position === selectedPosition
  )?.position || selectedPosition;

  if (nextValue) {
    positionSelect.value = nextValue;
  }
}

function bindEmployeeRegistrationSelectors(form, selectedIndustry = '', selectedPosition = '') {
  if (!form) return;

  const trackSelect = form.industryTrack;
  const positionSelect = form.positionChoice;
  if (!trackSelect || !positionSelect || trackSelect.dataset.bound === '1') return;

  const initialTrack = Object.entries(EMPLOYEE_REGISTRATION_OPTIONS).find(([, options]) =>
    options.some((item) => item.industry === selectedIndustry && item.position === selectedPosition)
  )?.[0] || '';

  if (initialTrack) {
    trackSelect.value = initialTrack;
  }

  populateEmployeeRegistrationPositions(trackSelect, positionSelect, selectedIndustry, selectedPosition);
  trackSelect.addEventListener('change', () => {
    populateEmployeeRegistrationPositions(trackSelect, positionSelect);
  });

  trackSelect.dataset.bound = '1';
}

function configureEmployeeRegistrationFromApplication(form, params) {
  if (!form || params.get('applied') !== '1') return;

  const summaryCard = document.getElementById('employeeApplicationSummary');
  const summaryText = document.getElementById('employeeApplicationSummaryText');
  const position = String(params.get('position') || '').trim();
  const email = String(params.get('email') || '').trim();
  const phone = formatPhoneDisplay(params.get('phone') || '');
  const addressParts = [params.get('address'), params.get('city'), params.get('state'), params.get('zip')]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  if (form.certifyAgreement) {
    form.certifyAgreement.checked = true;
  }

  form.querySelectorAll('.employee-application-prefill').forEach((row) => {
    row.hidden = true;
    row.style.display = 'none';
    row.setAttribute('aria-hidden', 'true');
  });

  form.querySelectorAll('.employee-direct-selection').forEach((row) => {
    row.hidden = true;
    row.style.display = 'none';
    row.setAttribute('aria-hidden', 'true');
    row.querySelectorAll('input, select, textarea').forEach((field) => {
      field.disabled = true;
    });
  });

  if (summaryCard) {
    summaryCard.hidden = false;
  }

  if (summaryText) {
    const details = [];
    if (position) details.push(position);
    if (email) details.push(email);
    if (phone) details.push(phone);
    if (addressParts.length) details.push(addressParts.join(', '));
    summaryText.textContent = details.length
      ? `Your application is already on file for ${details.join(' | ')}. Create your password below to finish portal setup.`
      : 'Your application is already on file. Create your password below to finish portal setup.';
  }
}

function bindPasswordVisibilityToggles() {
  const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));

  passwordInputs.forEach((input, index) => {
    try {
      if (!input || input.dataset.passwordToggleBound === '1') return;

      const row = input.closest('.form-row') || input.parentElement;
      if (!row) return;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'button button--ghost button--sm';
      toggle.textContent = 'Show';
      toggle.setAttribute('aria-label', `Show ${input.name || 'password'} value`);
      toggle.style.marginTop = '0.5rem';
      toggle.dataset.passwordToggleIndex = String(index);

      toggle.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggle.textContent = isPassword ? 'Hide' : 'Show';
        toggle.setAttribute('aria-label', `${isPassword ? 'Hide' : 'Show'} ${input.name || 'password'} value`);
      });

      row.appendChild(toggle);
      input.dataset.passwordToggleBound = '1';
    } catch (_error) {
      // Never let password toggle enhancements break portal initialization.
    }
  });
}

async function loadCurrentUser(options = {}) {
  try {
    const res = await apiFetch('/api/auth/me', {
      _skipAuthRedirect: true,
      _omitStoredToken: options.cookieOnly === true,
    });
    if (!res.ok) return null;
    const payload = await res.json();
    portalSmtpConfigured = payload && payload.emailConfigured !== false && payload.smtpConfigured !== false;
    if (isEmployeePortalPage() && payload && payload.user && payload.user.preferredLanguage) {
      setPortalDocumentLanguage(payload.user.preferredLanguage || PORTAL_DEFAULT_LANGUAGE);
      applyPortalStaticTranslations();
    }
    return payload.user;
  } catch (_error) {
    portalSmtpConfigured = true;
    return null;
  }
}

function showSmtpStatusWarningIfNeeded() {
  if (portalSmtpConfigured) return;
  const status = document.getElementById('portalNotificationStatus');
  if (!status) return;
  setMessage(status, 'Email delivery is not configured on this server yet (Postmark missing). Portal and push notifications still work.', 'neutral');
}

async function handlePortalLoginSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const msg = document.getElementById('portalLoginMessage');
  hideMessage(msg);

  const email = form.email.value.trim();
  const password = form.password.value;
  const passcode = form.passcode ? form.passcode.value.trim() : '';
  const passcodeToSend = password ? '' : passcode;

  if (!email || (!password && !passcodeToSend)) {
    setMessage(msg, 'Email and password or 4-digit passcode are required.', 'error');
    return;
  }

  if (passcodeToSend && !/^\d{4}$/.test(passcodeToSend)) {
    setMessage(msg, 'Passcode must be exactly 4 digits.', 'error');
    return;
  }

  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, passcode: passcodeToSend }),
    _skipAuthRedirect: true,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    setMessage(msg, data.error || 'Login failed.', 'error');
    return;
  }

  const data = await res.json();
  saveToken(data.token);
  const redirectTarget = getPortalRedirectTargetFromUrl();
  window.location.href = redirectTarget || (data && data.user && data.user.homePath
    ? data.user.homePath
    : routeForRole(data.user.role, data.user.portalScope));
}

function bindAuthEntryForms() {
  const loginForm = document.getElementById('portalLoginForm');
  if (loginForm && loginForm.dataset.bound !== '1') {
    loginForm.dataset.bound = '1';
    loginForm.addEventListener('submit', handlePortalLoginSubmit);
  }

  const registerForm = document.getElementById('portalRegisterForm');
  if (registerForm && registerForm.dataset.bound !== '1') {
    registerForm.dataset.bound = '1';
    registerForm.addEventListener('submit', handlePortalRegisterSubmit);
  }
}

function toggleRegisterRoleFields(role, revealDetails = false) {
  const jobsiteRows = document.querySelectorAll('.role-jobsite-only');
  const isJobsite = role === 'jobsite';
  const roleTiles = document.querySelectorAll('[data-role-choice]');
  const registerDetails = document.getElementById('registerDetails');
  const registerRoleChooser = document.getElementById('registerRoleChooser');
  const registerSubtitle = document.getElementById('portalRegisterSubtitle');

  roleTiles.forEach((tile) => {
    const isActive = tile.dataset.roleChoice === role;
    tile.classList.toggle('role-tile--active', isActive);
    tile.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (registerDetails) {
    registerDetails.hidden = !revealDetails || !role;
  }

  if (registerRoleChooser) {
    registerRoleChooser.hidden = Boolean(role && revealDetails);
  }

  if (registerSubtitle) {
    if (role === 'employee' && revealDetails) {
      registerSubtitle.textContent = 'Complete the employee registration form.';
    } else if (role === 'jobsite' && revealDetails) {
      registerSubtitle.textContent = 'Complete the client registration form.';
    } else {
      registerSubtitle.textContent = 'Register as an Employee or Jobsite account.';
    }
  }

  jobsiteRows.forEach((row) => {
    row.hidden = !isJobsite;
    row.style.display = isJobsite ? '' : 'none';
    row.setAttribute('aria-hidden', isJobsite ? 'false' : 'true');

    const fields = row.querySelectorAll('input, select, textarea');
    fields.forEach((field) => {
      field.disabled = !isJobsite;
      if (!isJobsite && 'value' in field) {
        field.value = '';
      }
    });
  });
}

async function handlePortalRegisterSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const roleField = document.getElementById('registerRole');
  const msg = document.getElementById('portalRegisterMessage');
  hideMessage(msg);

  const regFirstName = form.firstName ? form.firstName.value.trim() : '';
  const regLastName = form.lastName ? form.lastName.value.trim() : '';
  const regMiddleInitial = form.middleInitial
    ? String(form.middleInitial.value || '').trim().replace(/[^a-zA-Z]/g, '').slice(0, 1)
    : '';
  const assembledName = [regFirstName, regMiddleInitial, regLastName].filter(Boolean).join(' ');

  const payload = {
    role: roleField ? roleField.value.trim() : '',
    name: assembledName,
    email: form.email.value.trim(),
    password: form.password.value,
    passcode: form.passcode ? form.passcode.value.trim() : '',
    phone: form.phone.value.trim(),
    companyName: form.companyName ? form.companyName.value.trim() : '',
    contactName: form.contactName ? form.contactName.value.trim() : '',
    address: form.address ? form.address.value.trim() : '',
    city: form.city ? form.city.value.trim() : '',
    state: form.state ? form.state.value.trim() : '',
    zip: form.zip ? form.zip.value.trim() : '',
    industryTrack: form.industryTrack ? form.industryTrack.value.trim() : '',
    industry: '',
    position: '',
    certifyAgreement: form.certifyAgreement ? form.certifyAgreement.checked : false,
  };

  if (payload.role === 'employee' && form.positionChoice && !form.positionChoice.disabled) {
    const selectedOption = form.positionChoice.options[form.positionChoice.selectedIndex];
    payload.position = form.positionChoice.value.trim();
    payload.industry = selectedOption ? String(selectedOption.dataset.industry || '').trim() : '';
  }

  if (payload.role === 'jobsite') {
    const addressParts = [payload.address, payload.city, payload.state, payload.zip]
      .map((part) => String(part || '').trim())
      .filter(Boolean);
    payload.address = addressParts.join(', ');

    if (!normalizeIndustryTrack(payload.industryTrack)) {
      setMessage(msg, 'Select an industry track (Warehouse or Healthcare).', 'error');
      return;
    }

    if (!payload.companyName || !payload.companyName.trim()) {
      setMessage(msg, 'Company name is required for client accounts.', 'error');
      return;
    }

    if (!payload.contactName || !payload.contactName.trim()) {
      setMessage(msg, 'Primary contact name is required for client accounts.', 'error');
      return;
    }
  }

  if (!payload.role || !regFirstName || !regLastName || !payload.email || !payload.password) {
    setMessage(msg, 'Role, first name, last name, email, and password are required.', 'error');
    return;
  }

  if (payload.password.length < 8) {
    setMessage(msg, 'Password must be at least 8 characters.', 'error');
    return;
  }

  if (payload.passcode && !/^\d{4}$/.test(payload.passcode)) {
    setMessage(msg, 'Passcode must be exactly 4 digits.', 'error');
    return;
  }

  const normalizedPhone = phoneDigits(payload.phone);
  if (payload.phone && normalizedPhone.length !== 10) {
    setMessage(msg, 'Phone number must be exactly 10 digits.', 'error');
    return;
  }
  payload.phone = normalizedPhone;

  if (payload.role === 'employee' && !payload.certifyAgreement) {
    setMessage(msg, 'You must certify the employment statement before creating an employee account.', 'error');
    return;
  }

  if (payload.role === 'employee' && form.positionChoice && !form.positionChoice.disabled && (!payload.industry || !payload.position)) {
    setMessage(msg, 'Select an industry and position for employee registration.', 'error');
    return;
  }

  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    _skipAuthRedirect: true,
  });

  const registrationData = await res.json().catch(() => ({}));

  if (!res.ok) {
    setMessage(msg, registrationData.error || 'Registration failed.', 'error');
    return;
  }

  const verificationNotice = registrationData && registrationData.verificationEmailResent
    ? 'Verification email re-sent. Redirecting to login...'
    : 'Account created. Check your email to verify your account. Redirecting to login...';

  setMessage(msg, verificationNotice, 'success');
  setTimeout(() => {
    const loginRoute = IS_FILE_PROTOCOL ? 'portal-login.html' : '/portal-login';
    const params = new URLSearchParams();
    params.set('email', payload.email);
    params.set('verificationPending', '1');
    if (registrationData && registrationData.verificationEmailResent) {
      params.set('resentVerification', '1');
    }
    window.location.href = `${loginRoute}?${params.toString()}`;
  }, 900);
}

async function handleLogout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (_error) {
    // Even if the server logout request fails, force local logout and redirect.
  } finally {
    clearToken();
    window.location.href = routeForRole('login');
  }
}

function renderEmployeeDashboard(data) {
  employeeDashboardPayload = data;
  const greeting = document.getElementById('portalGreeting');
  if (greeting) {
    const employeeName = String(data.user?.name || 'Employee').trim();
    greeting.textContent = t('header.welcomeEmployee', { name: employeeName });
  }
  
  const industry = document.getElementById('portalIndustry');
  if (industry) {
    renderEmployeeHeaderInto(industry, data);
  }

  populateAccountIdentityFields(data.user, { profile: data.profile || {} });
  applyPortalStaticTranslations();

  // Stat cards
  employeeOnboardingStatus = String(data.onboardingStatus || ((data.compliance && data.compliance.isComplete) ? 'active' : 'registered')).toLowerCase();
  employeeCompliance = data.compliance || null;
  setText('statApplications', (data.applications || []).length);
  setText('statDocuments', (data.documents || []).length);
  setText('statComplete', (data.compliance && data.compliance.isComplete) ? 'Yes' : 'No');
  setText('statAssignments', (data.currentAssignments || []).length);

  // Populate upload dropdown based on this employee's industry
  const primaryIndustry = inferPrimaryIndustry(data.applications || []);
  populateDocumentTypeSelect(primaryIndustry);
  syncEmployeeTrainingSection(primaryIndustry);

  // Profile
  const profile = document.getElementById('employeeProfile');
  if (profile) {
    const headerData = resolveEmployeeHeaderData(data);
    const backgroundStatusText = formatBackgroundStatus(data?.profile?.backgroundStatus);
    const bgDisplay = data.hasAdminBackgroundDocument
      ? backgroundStatusBadge(data.profile.backgroundStatus)
      : '<span class="badge badge--gray">Waiting for admin-uploaded background</span>';
    profile.innerHTML = `
      ${renderEmployeeHeaderComponent(data, { surface: true })}
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('account.fullName'))}</span><span>${escapeHtml(data.user.name || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('account.emailLabel'))}</span><span>${escapeHtml(data.user.email)}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('employee.position'))}</span><span>${escapeHtml(headerData.positionTitle || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('employee.backgroundCheck'))}</span><span>${bgDisplay}${data.hasAdminBackgroundDocument ? `<span style="display:block;margin-top:0.3rem;color:var(--color-muted);font-size:0.82rem;">${escapeHtml(t('common.status'))}: ${escapeHtml(backgroundStatusText)}</span>` : ''}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('common.phone'))}</span><span>${escapeHtml(formatPhoneForView(data.profile.phone, t('common.notSet')))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('employee.address'))}</span><span>${escapeHtml([data.profile.address, data.profile.city, data.profile.state, data.profile.zip].filter(Boolean).join(', ') || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('account.skills'))}</span><span>${escapeHtml(data.profile.skills || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('account.certifications'))}</span><span>${escapeHtml(data.profile.certifications || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('employee.ssn'))}</span><span>${data.ssnOnFile ? `<span class="badge badge--green">${escapeHtml(t('employee.ssnOnFile'))}</span>` : `<span class="badge badge--yellow">${escapeHtml(t('employee.ssnMissing'))}</span>`}</span></div>
    `;
    profile.dataset.phone = String(data.profile.phone || '');
    profile.dataset.address = String(data.profile.address || '');
    profile.dataset.city = String(data.profile.city || '');
    profile.dataset.state = String(data.profile.state || '');
    profile.dataset.zip = String(data.profile.zip || '');
    profile.dataset.skills = String(data.profile.skills || '');
    profile.dataset.certifications = String(data.profile.certifications || '');
  }

  const backgroundFormStatus = document.getElementById('employeeBackgroundFormStatus');
  if (backgroundFormStatus) {
    const docs = Array.isArray(data.documents) ? data.documents : [];
    const backgroundFormDoc = docs.find((doc) => String(doc.documentType || '').toLowerCase() === 'background_clearance_form');
    if (!backgroundFormDoc) {
      setMessage(backgroundFormStatus, 'No completed background form uploaded yet.', 'neutral');
    } else {
      const reviewStatus = String(backgroundFormDoc.documentStatus || 'pending').toLowerCase();
      const reviewLabel = reviewStatus === 'approved'
        ? 'Approved'
        : reviewStatus === 'denied'
          ? 'Needs Update'
          : 'Pending Review';
      const uploadedDate = backgroundFormDoc.createdAt ? formatDateOnly(backgroundFormDoc.createdAt) : 'today';
      const link = backgroundFormDoc.fileUrl
        ? ` <a class="link" href="${escapeHtml(backgroundFormDoc.fileUrl)}" target="_blank" rel="noopener">View uploaded form</a>`
        : '';
      setMessage(backgroundFormStatus, `Completed background form uploaded ${uploadedDate}. Status: ${reviewLabel}.${link}`, 'success');
    }
  }

  // Current assignments
  const current = document.getElementById('employeeCurrentAssignments');
  if (current) {
    const list = data.currentAssignments || [];
    current.innerHTML = list.length
      ? list.map(a => `
        <div class="assignment-card">
          <div class="assignment-card__title">${escapeHtml(a.title)}</div>
          <div class="assignment-card__meta">${escapeHtml(a.companyName || 'Unassigned jobsite')} &bull; ${statusBadge(a.status || 'assigned')}</div>
          ${a.statPayEnabled ? `<div class="assignment-card__meta">${statPayApprovalMarkup(a)}</div>` : ''}
          ${a.clientAddress ? `<div class="assignment-card__meta">${escapeHtml(a.clientAddress)}</div>` : ''}
          <div class="assignment-card__meta">${escapeHtml(a.schedule || 'Schedule pending')}</div>
          ${a.statusReason ? `<div class="assignment-card__meta">Reason: ${escapeHtml(a.statusReason)}</div>` : ''}
          <div class="form-actions" style="margin-top:0.9rem;">
            <button class="button button--ghost button--sm" type="button" data-offer-assignment-id="${escapeHtml(a.id)}" data-shift-title="${escapeHtml(a.title)}" ${employeeOnboardingStatus === 'active' ? '' : 'disabled'}>Offer Privately</button>
            <button class="button button--danger button--sm" type="button" data-withdraw-assignment-id="${escapeHtml(a.id)}" data-withdraw-schedule="${escapeHtml(a.schedule || '')}" data-withdraw-shift-title="${escapeHtml(a.title || 'Shift')}" ${employeeOnboardingStatus === 'active' ? '' : 'disabled'}>Withdraw Shift</button>
          </div>
          ${employeeOnboardingStatus === 'active' ? '' : `<div class="assignment-card__meta">${escapeHtml(getEmployeeOnboardingBlockMessage(employeeCompliance, 'manage assigned shifts'))}</div>`}
        </div>
      `).join('')
      : `<p class="empty-state">${escapeHtml(t('employee.noCurrentAssignments'))}</p>`;
  }

  // Past assignments
  const past = document.getElementById('employeePastAssignments');
  if (past) {
    const list = data.pastAssignments || [];
    past.innerHTML = list.length
        ? list.map(a => `<div class="assignment-card assignment-card--faded"><div class="assignment-card__title">${escapeHtml(a.title)}</div><div class="assignment-card__meta">${escapeHtml(a.companyName || 'Unassigned jobsite')} &bull; ${statusBadge(a.status)}</div>${a.statPayEnabled ? `<div class="assignment-card__meta">${statPayApprovalMarkup(a)}</div>` : ''}${a.clientAddress ? `<div class="assignment-card__meta">${escapeHtml(a.clientAddress)}</div>` : ''}${a.statusReason ? `<div class="assignment-card__meta">Reason: ${escapeHtml(a.statusReason)}</div>` : ''}</div>`).join('')
      : `<p class="empty-state">${escapeHtml(t('employee.noPastAssignments'))}</p>`;
  }

  // Applications table
  setTableRows(
    'employeeApplications',
    (data.applications || []).map(item => {
      const cert = item.certificationAccepted ? statusBadge('accepted') : statusBadge('missing');
      const withdrawAction = `<button class="button button--ghost button--sm" type="button" data-withdraw-application-id="${item.id}">Withdraw</button>`;
      const industryDisplay = formatIndustryDisplay(item.industry);
      return `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.position || '—')}</td><td>${escapeHtml(industryDisplay)}</td><td>${escapeHtml(item.createdAt ? formatDateOnly(item.createdAt) : '—')}</td><td>${cert}</td><td>${withdrawAction}</td></tr>`;
    }),
    6,
    t('employee.noApplications')
  );

  // Document checklist
  const checklistEl = document.getElementById('employeeChecklist');
  if (checklistEl) {
    const compliance = data.compliance;
    const latestDocumentByType = new Map();
    (data.documents || []).forEach((doc) => {
      const type = String(doc.documentType || '').trim();
      if (!type || latestDocumentByType.has(type)) return;
      latestDocumentByType.set(type, doc);
    });

    if (compliance && Array.isArray(compliance.items)) {
      // Build a lookup of exemption item for merging into the vaccine card row
      const itemByType = new Map(compliance.items.map(i => [i.documentType, i]));
      checklistEl.innerHTML = compliance.items.filter(item => {
        // Skip the religious exemption row — it will be merged into the vaccine card row
        return item.documentType !== 'covid19_religious_exemption_form';
      }).map(item => {
        let label = DOCUMENT_TYPE_LABELS[item.documentType] || item.documentType;
        let latestDoc = latestDocumentByType.get(String(item.documentType || '').trim());
        let viewUrl = latestDoc && latestDoc.fileUrl ? String(latestDoc.fileUrl) : '';
        let uploadAction;
        let viewAction = '';

        if (item.kind === 'form') {
          const formKey = item.documentType === 'background_acknowledgment_consent' ? 'background-consent' : 'hipaa-compliance';
          uploadAction = `<button class="button button--ghost button--sm" type="button" data-employee-web-form="${escapeHtml(formKey)}">${item.complete ? 'Review Form' : 'Complete Form'}</button>`;
        } else if (item.documentType === 'background_check') {
          uploadAction = '<span class="badge badge--gray">Admin Upload Only</span>';
        } else if (item.documentType === 'covid19_vaccine_card') {
          // Merged row: show combined label and two upload buttons
          label = 'Covid-19 Vaccine Card / Religious Exemption Form (signed by primary provider)';
          // Prefer whichever type has an uploaded doc for the View button
          const exemptDoc = latestDocumentByType.get('covid19_religious_exemption_form');
          if (!latestDoc && exemptDoc) { latestDoc = exemptDoc; viewUrl = exemptDoc.fileUrl ? String(exemptDoc.fileUrl) : ''; }
          uploadAction =
            `<button class="button button--ghost button--sm checklist-upload-btn" type="button" data-checklist-upload-type="covid19_vaccine_card">Upload Vaccine Card</button>` +
            `<button class="button button--ghost button--sm checklist-upload-btn" type="button" data-checklist-upload-type="covid19_religious_exemption_form">Upload Exemption Form</button>`;
          } else if (item.documentType === 'tuberculosis_screening_tb') {
            // Add download button for TB form (root directory)
            uploadAction = `<button class="button button--ghost button--sm checklist-upload-btn" type="button" data-checklist-upload-type="tuberculosis_screening_tb">Upload</button>` +
              `<a class="button button--ghost button--sm checklist-download-btn" href="/TB%20FORM.pdf" download target="_blank">Download Form</a>`;
          } else if (item.documentType === 'physical_form') {
            // Add download button for Physical Form (root directory)
            uploadAction = `<button class="button button--ghost button--sm checklist-upload-btn" type="button" data-checklist-upload-type="physical_form">Upload</button>` +
              `<a class="button button--ghost button--sm checklist-download-btn" href="/Physical%20Form.pdf" download target="_blank">Download Form</a>`;
        } else {
          uploadAction = `<button class="button button--ghost button--sm checklist-upload-btn" type="button" data-checklist-upload-type="${escapeHtml(item.documentType)}">Upload</button>`;
        }

        let badge;
        if (!item.required && item.uploadedCount === 0) {
          badge = '<span class="badge badge--gray">Optional</span>';
        } else if (item.pendingApproval) {
          badge = '<span class="badge badge--yellow">Review Pending</span>';
        } else if (item.missingRequired) {
          badge = '<span class="badge badge--red">Missing</span>';
        } else if (item.missingExpiration) {
          badge = '<span class="badge badge--yellow">Needs Date</span>';
        } else {
          badge = '<span class="badge badge--green">Complete</span>';
        }
        if (item.kind !== 'form') {
          viewAction = viewUrl
            ? `<button class="button button--ghost button--sm checklist-view-btn" type="button" data-checklist-view-url="${escapeHtml(viewUrl)}">View Document</button>`
            : '<button class="button button--ghost button--sm checklist-view-btn" type="button" disabled>View Document</button>';
        }
        return `<li><span class="checklist-item-left">${badge}</span><span class="checklist-item-right"><span class="checklist-doc-name">${escapeHtml(label)}</span>${viewAction}${uploadAction}</span></li>`;
      }).join('');
    } else {
      checklistEl.innerHTML = '<li>No checklist available yet.</li>';
    }
  }

  renderEmployeeTodoForms(data);

  // Documents table
  setTableRows(
    'employeeDocuments',
    (data.documents || []).map(item => {
      const docStatus = item.documentStatus || 'pending';
      const statusCls = docStatus === 'approved' ? 'badge--green' : docStatus === 'denied' ? 'badge--red' : 'badge--yellow';
      const statusBdg = `<span class="badge ${statusCls}">${escapeHtml(docStatus)}</span>`;
      return `<tr><td>${escapeHtml(DOCUMENT_TYPE_LABELS[item.documentType] || item.documentType)}</td><td>${escapeHtml(item.originalName)}</td><td>${escapeHtml(item.createdAt ? formatDateOnly(item.createdAt) : '\u2014')}</td><td>${escapeHtml(item.expirationDate ? formatDateOnly(item.expirationDate) : '\u2014')}</td><td>${statusBdg}</td></tr>`;
    }),
    5,
    t('employee.noDocuments')
  );

  // W-4 form pre-fill
  const w4FormEl = document.getElementById('employeeW4Form');
  if (w4FormEl) applyEmployeeW4Form(w4FormEl, data.w4Form || null);

  // W-9 form pre-fill
  const w9FormEl = document.getElementById('employeeW9Form');
  if (w9FormEl) applyEmployeeW9Form(w9FormEl, data.w9Form || null);

}

function renderEmployeeNcnsAssignments(items) {
  const el = document.getElementById('employeeNcnsAssignmentsList');
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = '<p class="empty-state">No outstanding no-call-no-show documentation required.</p>';
    return;
  }
  el.innerHTML = items.map((item) => {
    const now = new Date();
    const windowEnd = item.windowExpiredAt ? new Date(item.windowExpiredAt) : null;
    const msLeft = windowEnd ? windowEnd.getTime() - now.getTime() : -1;
    const hoursLeft = msLeft > 0 ? Math.floor(msLeft / (1000 * 60 * 60)) : 0;
    const minsLeft = msLeft > 0 ? Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)) : 0;
    let actionHtml;
    if (item.alreadySubmitted) {
      actionHtml = '<span class="badge badge--green">Documentation Submitted</span>';
    } else if (!item.withinWindow) {
      actionHtml = '<span class="badge badge--red">Window Expired — Documentation cannot be submitted</span>';
    } else {
      actionHtml = `<button class="button button--danger button--sm" type="button"
        data-ncns-assignment-id="${escapeHtml(String(item.id))}"
        data-ncns-shift-title="${escapeHtml(String(item.shiftTitle || 'Shift'))}"
        data-ncns-company="${escapeHtml(String(item.companyName || ''))}">Submit Documentation</button>
        <span style="font-size:0.8rem;color:var(--color-warning,#f59e0b);margin-left:0.5rem;">${hoursLeft}h ${minsLeft}m remaining</span>`;
    }
    return `<div class="assignment-card assignment-card--faded" style="border-color:rgba(239,68,68,0.3);">
      <div class="assignment-card__title">${escapeHtml(String(item.shiftTitle || 'Shift'))}</div>
      <div class="assignment-card__meta">${escapeHtml(String(item.companyName || ''))} &bull; ${statusBadge('no_call_no_show')}</div>
      <div class="assignment-card__meta">Shift ended: ${item.shiftEndAt ? escapeHtml(formatDateTime(item.shiftEndAt)) : 'Unknown'}</div>
      <div class="form-actions" style="margin-top:0.7rem;">${actionHtml}</div>
    </div>`;
  }).join('');
}

function renderJobsiteDashboard(data) {
  jobsiteDashboardPayload = data;
  const greeting = document.getElementById('portalGreeting');
  if (greeting) {
    const companyName = String(data.profile?.companyName || data.user?.name || 'Client').trim();
    greeting.textContent = t('header.welcomeClient', { name: companyName });
  }
  
  const industry = document.getElementById('portalIndustry');
  if (industry) {
    const industryTrack = String(data.profile?.industryTrack || '—').trim();
    industry.textContent = formatIndustryDisplay(industryTrack);
  }

  populateAccountIdentityFields(data.user, { profile: data.profile || {} });
  applyPortalStaticTranslations();

  applyJobsiteIndustryTrackToForms(data && data.profile ? data.profile.industryTrack : 'warehouse');

  // Stat cards
  const allJobs = data.jobs || [];
  setText('statTotalJobs', allJobs.length);
  setText('statOpenJobs', allJobs.filter(j => j.status === 'open').length);
  setText('statClosedJobs', allJobs.filter(j => j.status === 'closed').length);

  // Company profile
  const profile = document.getElementById('jobsiteProfile');
  if (profile) {
    profile.innerHTML = `
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('account.fullName'))}</span><span>${escapeHtml(data.user.name || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('jobsite.company'))}</span><span>${escapeHtml(data.profile.companyName || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('jobsite.contact'))}</span><span>${escapeHtml(data.profile.contactName || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('account.emailLabel'))}</span><span>${escapeHtml(data.user.email || t('common.notSet'))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('jobsite.industryTrack'))}</span><span>${escapeHtml(formatIndustryTrackLabel(data.profile.industryTrack))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('common.phone'))}</span><span>${escapeHtml(formatPhoneForView(data.profile.phone, t('common.notSet')))}</span></div>
      <div class="profile-info__item"><span class="profile-info__label">${escapeHtml(t('employee.address'))}</span><span>${escapeHtml([data.profile.address, data.profile.city, data.profile.state, data.profile.zip].filter(Boolean).join(', ') || t('common.notSet'))}</span></div>
    `;
  }

  // Assigned workers
  setTableRows(
    'jobsiteAssignedWorkers',
    (data.assignments || []).map((a) => {
      const reasonText = a.statusReason ? `<div style="font-size:0.78rem;color:var(--color-muted);margin-top:0.25rem;">Reason: ${escapeHtml(a.statusReason)}</div>` : '';
      return `<tr><td>${escapeHtml(a.employeeName || '—')}</td><td>${escapeHtml(a.employeePosition || '—')}</td><td>${escapeHtml(a.jobTitle || '—')}${a.jobSchedule ? `<br><span style="font-size:0.78rem;color:var(--color-muted);">${escapeHtml(a.jobSchedule)}</span>` : ''}</td><td>${statusBadge(a.status || 'assigned')}${reasonText}</td><td><div style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center;"><select data-jobsite-assignment-status="${escapeHtml(a.id)}" class="input input--sm" style="min-width:150px;"><option value="assigned" ${String(a.status) === 'assigned' ? 'selected' : ''}>Assigned</option><option value="approved" ${String(a.status) === 'approved' ? 'selected' : ''}>Approved</option><option value="completed" ${String(a.status) === 'completed' ? 'selected' : ''}>Completed</option><option value="cancelled" ${String(a.status) === 'cancelled' ? 'selected' : ''}>Cancelled</option><option value="no_call_no_show" ${String(a.status) === 'no_call_no_show' ? 'selected' : ''}>No Call No Show</option></select><button class="button button--ghost button--sm" type="button" data-jobsite-apply-assignment-status="${escapeHtml(a.id)}">Apply</button></div></td></tr>`;
    }),
    5,
    t('jobsite.noAssignedWorkers')
  );

  // Assigned worker documents (scoped and filtered by backend)
  setTableRows(
    'jobsiteWorkerDocuments',
    (data.workerDocuments || []).map((doc) => {
      const typeLabel = DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType || 'Document';
      const docType = String(doc.documentType || '').toLowerCase();
      const isApproved = String(doc.documentStatus || '').toLowerCase() === 'approved';
      const isSensitive = docType === 'id_or_drivers_license' || docType === 'social_security_or_work_authorization';
      const isBackgroundCheck = docType === 'background_check';

      let fileLink;
      if (isSensitive && isApproved) {
        fileLink = '<span class="badge badge--approval-status">Valid</span>';
      } else if (isBackgroundCheck && isApproved) {
        fileLink = '<span class="badge badge--approval-status">Cleared</span>';
      } else if (doc.fileUrl) {
        fileLink = `<a class="link" href="${escapeHtml(doc.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(doc.originalName || 'View file')}</a>`;
      } else {
        fileLink = escapeHtml(doc.originalName || 'N/A');
      }

      const uploaded = doc.createdAt ? formatDateOnly(doc.createdAt) : 'N/A';
      return `<tr><td>${escapeHtml(doc.employeeName || 'N/A')}</td><td>${escapeHtml(doc.employeePosition || 'N/A')}</td><td>${backgroundStatusBadge(doc.backgroundStatus)}</td><td>${escapeHtml(doc.jobTitle || 'N/A')}</td><td>${escapeHtml(typeLabel)}</td><td>${fileLink}</td><td>${escapeHtml(uploaded)}</td></tr>`;
    }),
    7,
    'No approved worker documents are available yet for assigned staff.'
  );

function renderJobsiteDashboard(data) {
  // ...existing code...
  setTableRows(
    'jobsiteWorkerComplianceForms',
    (data.workerComplianceForms || []).map((item) => {
      const backgroundCell = item.backgroundConsentSigned
        ? `<span class="badge badge--green">Signed ${escapeHtml(item.backgroundConsentSignedDate ? formatDateOnly(item.backgroundConsentSignedDate) : '')}</span> <a class="link" href="${escapeHtml(getSignedOnboardingFormUrl('background-consent', item.employeeUserId))}" target="_blank" rel="noopener">View</a>`
        : '<span class="badge badge--yellow">Pending</span>';
      const hipaaCell = item.hipaaComplianceSigned
        ? `<span class="badge badge--green">Signed ${escapeHtml(item.hipaaComplianceSignedDate ? formatDateOnly(item.hipaaComplianceSignedDate) : '')}</span> <a class="link" href="${escapeHtml(getSignedOnboardingFormUrl('hipaa-compliance', item.employeeUserId))}" target="_blank" rel="noopener">View</a>`
        : '<span class="badge badge--yellow">Pending</span>';
      return `<tr><td>${escapeHtml(item.employeeName || 'N/A')}</td><td>${escapeHtml(item.employeePosition || 'N/A')}</td><td>${escapeHtml(item.jobTitle || 'N/A')}</td><td>${backgroundCell}</td><td>${hipaaCell}</td><td>${escapeHtml(item.updatedAt ? formatDateTime(item.updatedAt) : 'N/A')}</td></tr>`;
    }),
    6,
    'No signed worker compliance forms are available yet for assigned staff.'
  );
  // ...rest of function...
}

  // Jobs list
  const jobsEl = document.getElementById('jobsiteJobs');
  if (jobsEl) {
    if (!allJobs.length) {
      jobsEl.innerHTML = `<p class="empty-state">${escapeHtml(t('jobsite.noJobs'))}</p>`;
    } else {
      jobsEl.innerHTML = allJobs.map(job => `
        <div class="job-card-item">
          <div class="job-card-item__header">
            <span class="job-card-item__title">${escapeHtml(job.title)}</span>
            <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap;">${statusBadge(job.status)}${job.statPayEnabled ? statPayApprovalMarkup(job) : ''}</div>
          </div>
          <div class="job-card-item__meta">
            <span>${escapeHtml(formatIndustryDisplay(job.industry))}</span>
            ${job.schedule ? `<span>${escapeHtml(job.schedule)}</span>` : ''}
          </div>
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;align-items:center;margin:0.5rem 0;">
            <select data-jobsite-job-status="${job.id}" class="input input--sm" style="min-width:130px;">
              <option value="open" ${String(job.status) === 'open' ? 'selected' : ''}>Open</option>
              <option value="closed" ${String(job.status) === 'closed' ? 'selected' : ''}>Closed</option>
              <option value="draft" ${String(job.status) === 'draft' ? 'selected' : ''}>Draft</option>
            </select>
            <button class="button button--ghost button--sm" type="button" data-jobsite-apply-job-status="${job.id}">Apply Status</button>
            <label style="display:flex;align-items:center;gap:0.35rem;font-size:0.84rem;">
              <input type="checkbox" data-jobsite-stat-pay="${job.id}" ${job.statPayEnabled ? 'checked' : ''} />
              STAT PAY
            </label>
          </div>
          <button class="button button--ghost button--sm" type="button"
            data-edit-job-id="${job.id}"
            data-job-title="${escapeHtml(job.title)}"
            data-job-industry="${escapeHtml(job.industry)}"
            data-job-schedule="${escapeHtml(job.schedule || '')}"
            data-job-stat-pay="${job.statPayEnabled ? '1' : '0'}"
            data-job-stat-pay-signature="${escapeHtml(job.statPaySignatureName || '')}"
            data-job-status="${escapeHtml(job.status)}">Edit</button>
        </div>
      `).join('');
    }
  }
}

function renderAdminUsersTable() {
  const search = (document.getElementById('adminUserSearch')?.value || '').trim().toLowerCase();
  const employeeStatusById = new Map(
    (adminState.employees || []).map((employee) => [Number(employee.id), String(employee.onboardingStatus || '')])
  );
  const employeePositionById = new Map(
    (adminState.employees || []).map((employee) => [
      Number(employee.id),
      String(employee.positionType || employee.positionTitle || employee.position || '').trim(),
    ])
  );

  const rows = adminState.users
    .filter((item) => {
      if (!search) return true;
      const haystack = `${item.id} ${item.name} ${item.email} ${item.role}`.toLowerCase();
      return haystack.includes(search);
    })
    .map(
      (item) => {
        const isCurrentAdmin = Number(item.id) === Number(adminState.currentAdminId);
        const isAdminUser = String(item.role || '').toLowerCase() === 'admin';
        const canBulkSelect = !isAdminUser && !isCurrentAdmin;
        const roleCls = item.role === 'admin' ? 'badge--red' : item.role === 'jobsite' ? 'badge--yellow' : 'badge--blue';
        const roleBadge = `<span class="badge ${roleCls}">${escapeHtml(item.role)}</span>`;
        let activeBadge;
        if (String(item.role || '').toLowerCase() === 'employee') {
          const employeeStatus = employeeStatusById.get(Number(item.id));
          if (employeeStatus) {
            activeBadge = statusBadge(employeeStatus);
          } else {
            activeBadge = item.isActive ? '<span class="badge badge--yellow">Registered</span>' : '<span class="badge badge--gray">Inactive</span>';
          }
        } else {
          activeBadge = item.isActive ? '<span class="badge badge--green">Active</span>' : '<span class="badge badge--gray">Inactive</span>';
        }
        const action = isAdminUser && isCurrentAdmin
          ? '<span class="badge badge--gray" title="You cannot reset or delete your currently logged-in admin account from this table.">Protected</span>'
          : `<button class="button button--ghost button--sm" type="button" data-manage-user-id="${item.id}" data-manage-user-name="${escapeHtml(item.name)}" data-manage-user-role="${escapeHtml(item.role || '')}">Manage</button>`;
        const selectCell = canBulkSelect
          ? `<input type="checkbox" class="admin-user-row-check" data-user-id="${item.id}" data-user-name="${escapeHtml(item.name)}" data-user-role="${escapeHtml(item.role || '')}" aria-label="Select ${escapeHtml(item.name)}" />`
          : '<input type="checkbox" class="admin-user-row-check" disabled title="Admin users cannot be bulk selected" aria-label="Admin users cannot be bulk selected" />';
        const normalizedRole = String(item.role || '').toLowerCase();
        const positionType = normalizedRole === 'admin'
          ? 'Management'
          : normalizedRole === 'jobsite'
            ? 'Facility'
            : (employeePositionById.get(Number(item.id)) || '—');
        const industry = item.industryTrack ? (item.industryTrack.charAt(0).toUpperCase() + item.industryTrack.slice(1)) : 'N/A';
        return `<tr><td>${selectCell}</td><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.email)}</td><td>${roleBadge}</td><td>${escapeHtml(positionType)}</td><td>${escapeHtml(industry)}</td><td>${activeBadge}</td><td>${action}</td></tr>`;
      }
    );

  setTableRows('adminUsersTbody', rows, 9, 'No users match this filter.');
  updateAdminUsersBulkBar();
}

function updateAdminUsersBulkBar() {
  const usersTbody = document.getElementById('adminUsersTbody');
  const bulkBar = document.getElementById('adminUsersBulkBar');
  const bulkCount = document.getElementById('adminUsersBulkCount');
  const selectAll = document.getElementById('adminUsersSelectAll');
  if (!usersTbody || !bulkBar || !bulkCount || !selectAll) return;

  const selectableChecks = Array.from(usersTbody.querySelectorAll('.admin-user-row-check:not(:disabled)'));
  const checkedChecks = selectableChecks.filter((checkbox) => checkbox.checked);
  const selectedCount = checkedChecks.length;

  bulkCount.textContent = `${selectedCount} selected`;
  bulkBar.hidden = selectedCount < 1;

  if (!selectableChecks.length) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
    selectAll.disabled = true;
    return;
  }

  selectAll.disabled = false;
  selectAll.checked = selectedCount > 0 && selectedCount === selectableChecks.length;
  selectAll.indeterminate = selectedCount > 0 && selectedCount < selectableChecks.length;
}

function renderAdminJobsTable() {
  const search = (document.getElementById('adminJobSearch')?.value || '').trim().toLowerCase();
  const status = document.getElementById('adminJobStatusFilter')?.value || 'all';

  const rows = adminState.jobs
    .filter((item) => {
      const statusMatch = status === 'all' || item.status === status;
      if (!statusMatch) return false;
      if (!search) return true;
      const haystack = `${item.id} ${item.title} ${item.industry} ${item.companyName || ''} ${item.jobsiteName || ''} ${item.clientAddress || ''} ${item.assignmentCategory || ''} ${item.status}`.toLowerCase();
      return haystack.includes(search);
    })
    .map((item) => {
      const takenBy = String(item.assignedEmployeeName || '').trim() || 'Not Taken';
      const approval = String(item.latestTimesheetStatus || '').trim().toLowerCase();
      const approvalBadge = approval === 'approved'
        ? '<span class="badge badge--green">Approved</span>'
        : approval === 'pending_approval'
          ? '<span class="badge badge--yellow">Pending Approval</span>'
          : '<span class="badge badge--gray">Not Submitted</span>';

      const jobStatusSelect = `
        <select data-admin-job-status="${escapeHtml(item.id)}" class="input input--sm" style="min-width:120px;">
          <option value="open" ${String(item.status) === 'open' ? 'selected' : ''}>Open</option>
          <option value="closed" ${String(item.status) === 'closed' ? 'selected' : ''}>Closed</option>
          <option value="draft" ${String(item.status) === 'draft' ? 'selected' : ''}>Draft</option>
        </select>
      `;

      const assignmentStatusSelect = Number.isInteger(asInt(item.activeAssignmentId)) && asInt(item.activeAssignmentId) > 0
        ? `
          <select data-admin-assignment-status="${escapeHtml(item.activeAssignmentId)}" class="input input--sm" style="min-width:150px;">
            <option value="assigned" ${String(item.activeAssignmentStatus) === 'assigned' ? 'selected' : ''}>Assigned</option>
            <option value="approved" ${String(item.activeAssignmentStatus) === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="completed" ${String(item.activeAssignmentStatus) === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${String(item.activeAssignmentStatus) === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            <option value="no_call_no_show" ${String(item.activeAssignmentStatus) === 'no_call_no_show' ? 'selected' : ''}>No Call No Show</option>
          </select>
          <button class="button button--ghost button--sm" type="button" data-admin-apply-assignment-status="${escapeHtml(item.activeAssignmentId)}">Apply Assignment</button>
        `
        : '<span class="badge badge--gray">No active assignment</span>';

      const statPayBadge = item.statPayEnabled ? statPayApprovalMarkup(item) : '';

      const actionHtml = `<div style="display:flex;gap:0.35rem;flex-wrap:wrap;align-items:center;">${jobStatusSelect}<button class="button button--ghost button--sm" type="button" data-admin-apply-job-status="${escapeHtml(item.id)}">Apply Shift</button>${assignmentStatusSelect}${statPayBadge}</div>`;

      return `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(formatIndustryDisplay(item.industry))}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.companyName || item.jobsiteName || 'N/A')}</td><td>${escapeHtml(item.clientAddress || 'N/A')}</td><td>${statusBadge(item.assignmentCategory || 'Unassigned')}</td><td>${escapeHtml(takenBy)}</td><td>${approvalBadge}</td><td>${statusBadge(item.status)}</td><td>${actionHtml}</td></tr>`;
    });

  setTableRows('adminJobsTbody', rows, 10, 'No jobs match this filter.');
}

function renderAdminEmployeesTable() {
  const search = (document.getElementById('adminEmployeeSearch')?.value || '').trim().toLowerCase();

  const rows = adminState.employees
    .filter((item) => {
      if (!search) return true;
      const haystack = `${item.id} ${item.name} ${item.email} ${item.phone || ''} ${item.position || ''}`.toLowerCase();
      return haystack.includes(search);
    })
    .map(
      (item) => {
        const status = item.onboardingStatus || (item.isActive ? 'registered' : 'inactive');
        const activeBadge = statusBadge(status);
        const action = `<button class="button button--ghost button--sm" type="button" data-view-employee-id="${item.id}">View Profile</button>`;
        const industryLabel = item.industry ? item.industry.charAt(0).toUpperCase() + item.industry.slice(1) : 'Warehouse';
        return `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.email)}</td><td>${escapeHtml(industryLabel)}</td><td>${escapeHtml(item.position || '—')}</td><td>${escapeHtml(formatPhoneForView(item.phone, 'N/A'))}</td><td>${activeBadge}</td><td>${action}</td></tr>`;
      }
    );

  setTableRows('adminEmployeesTbody', rows, 8, 'No employees match this filter.');
}

function hideAdminEmployeeDetail() {
  const section = document.getElementById('adminEmployeeDetailSection');
  const msg = document.getElementById('adminEmployeeDetailMessage');
  const downloadBtn = document.getElementById('adminEmployeeDownloadAllFilesBtn');
  const profileEl = document.getElementById('adminEmployeeProfile');
  const checklistEl = document.getElementById('adminEmployeeChecklist');
  const onboardingDetailPanel = document.getElementById('adminOnboardingFormDetailPanel');
  const onboardingDetailBody = document.getElementById('adminOnboardingFormDetailBody');
  const onboardingDetailMsg = document.getElementById('adminOnboardingFormDetailMessage');

  if (section) section.hidden = true;
  if (msg) hideMessage(msg);
  if (downloadBtn) {
    downloadBtn.hidden = true;
    delete downloadBtn.dataset.downloadUrl;
  }
  if (profileEl) profileEl.innerHTML = '';
  if (checklistEl) checklistEl.innerHTML = '';
  if (onboardingDetailPanel) onboardingDetailPanel.hidden = true;
  if (onboardingDetailBody) onboardingDetailBody.innerHTML = '';
  if (onboardingDetailMsg) setMessage(onboardingDetailMsg, 'Select an onboarding form to review.', 'neutral');
  closeAdminChecklistUploadForm();

  setTableRows('adminEmployeeDocuments', [], 6, 'Select an employee to view details.');
  setTableRows('adminEmployeeTaxForms', [], 5, 'Select an employee to view tax forms.');
  setTableRows('adminEmployeeOnboardingForms', [], 6, 'Select an employee to view onboarding forms.');
  adminState.selectedEmployeeId = null;
  adminState.selectedEmployeeDetail = null;
  closePortalDrawer();
}

function parseArchiveMissingFilesHeader(response) {
  const raw = String(response && response.headers ? response.headers.get('X-Archive-Missing-Files') || '' : '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed.map((item) => String(item || '').trim()).filter(Boolean) : [];
  } catch (_error) {
    return [];
  }
}

function getDownloadFileNameFromResponse(response, fallbackName = 'employee-documents.zip') {
  const disposition = String(response && response.headers ? response.headers.get('Content-Disposition') || '' : '').trim();
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match && match[1] ? match[1] : fallbackName;
}

function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function handleAdminEmployeeDocumentBundleDownload() {
  const downloadBtn = document.getElementById('adminEmployeeDownloadAllFilesBtn');
  const msg = document.getElementById('adminEmployeeDetailMessage');
  const downloadUrl = String(downloadBtn?.dataset?.downloadUrl || '').trim();
  if (!downloadBtn || !downloadUrl) return;

  hideMessage(msg);
  downloadBtn.disabled = true;
  const previousText = downloadBtn.textContent;
  downloadBtn.textContent = 'Preparing...';

  try {
    const res = await apiFetch(downloadUrl);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(msg, payload.error || 'Failed to download document bundle.', 'error');
      return;
    }

    const blob = await res.blob();
    triggerBlobDownload(blob, getDownloadFileNameFromResponse(res));

    const missingFiles = parseArchiveMissingFilesHeader(res);
    if (missingFiles.length) {
      setMessage(msg, `Downloaded bundle with unavailable files: ${missingFiles.join(' | ')}`, 'error');
    } else {
      setMessage(msg, 'Downloaded all uploaded files.', 'success');
    }
  } catch (error) {
    setMessage(msg, error && error.message ? error.message : 'Failed to download document bundle.', 'error');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = previousText;
  }
}

function renderAdminEmployeeDetail(data) {
  try {
    const section = document.getElementById('adminEmployeeDetailSection');
    const title = document.getElementById('adminEmployeeDetailTitle');
    const msg = document.getElementById('adminEmployeeDetailMessage');
    const downloadBtn = document.getElementById('adminEmployeeDownloadAllFilesBtn');
    const profileEl = document.getElementById('adminEmployeeProfile');
    const checklistEl = document.getElementById('adminEmployeeChecklist');

    if (!section || !profileEl || !checklistEl) {
      console.error('Missing required HTML elements for employee detail rendering');
      return;
    }

    const employee = data.employee || {};
    const compliance = data.compliance || {};
    const profileComplete = compliance.isComplete ? 'Complete' : 'Incomplete';
    const onboardingStatus = data.onboardingStatus || (employee.isActive ? 'registered' : 'inactive');
    const canShowChecklistUpload = Boolean(document.getElementById('adminChecklistUploadForm'));

    if (title) title.textContent = `Employee Profile: ${employee.name || 'Unknown Employee'}`;
    if (msg) hideMessage(msg);
    if (canShowChecklistUpload) closeAdminChecklistUploadForm();
    if (downloadBtn) {
      const canDownloadAllFiles = Boolean(data.requiredUploadedDocumentSetComplete) && Number.isInteger(asInt(employee.id));
      downloadBtn.hidden = !canDownloadAllFiles;
      if (canDownloadAllFiles) {
        downloadBtn.dataset.downloadUrl = `${getScopedEmployeeApiBasePath()}/${encodeURIComponent(String(employee.id))}/documents/download-all`;
      } else {
        delete downloadBtn.dataset.downloadUrl;
      }
    }

  profileEl.innerHTML = `
    ${renderEmployeeHeaderComponent(data, { surface: true })}
    <div class="profile-info__item"><span class="profile-info__label">Email</span><span>${escapeHtml(employee.email || 'N/A')}</span></div>
    <div class="profile-info__item"><span class="profile-info__label">Phone</span><span>${escapeHtml(formatPhoneForView(employee.phone, 'N/A'))}</span></div>
    <div class="profile-info__item"><span class="profile-info__label">Address</span><span>${escapeHtml([employee.address, employee.city, employee.state, employee.zip].filter(Boolean).join(', ') || 'N/A')}</span></div>
    <div class="profile-info__item"><span class="profile-info__label">Skills</span><span>${escapeHtml(employee.skills || 'N/A')}</span></div>
    <div class="profile-info__item"><span class="profile-info__label">Certifications</span><span>${escapeHtml(employee.certifications || 'N/A')}</span></div>
    <div class="profile-info__item"><span class="profile-info__label">Background Check</span><span>${backgroundStatusBadge(employee.backgroundStatus)}</span></div>
    <div class="profile-info__item"><span class="profile-info__label">Profile Status</span><span>${statusBadge(profileComplete)}</span></div>
    <div class="profile-info__item"><span class="profile-info__label">Employee Status</span><span>${statusBadge(onboardingStatus)}</span></div>
    <div class="profile-info__item" id="adminSsnRow">
      <span class="profile-info__label">SSN</span>
      <span id="adminSsnValue">${data.ssnOnFile ? '<span class="badge badge--green">On File (Encrypted)</span>' : '<span class="badge badge--gray">Not Submitted</span>'}</span>
      ${data.ssnOnFile ? `<button type="button" class="button button--ghost button--sm" id="adminSsnViewBtn" style="margin-left:0.7rem;" data-employee-id="${escapeHtml(employee.id)}">View SSN</button>` : ''}
    </div>
  `;

  const latestDocByType = new Map();
  (data.documents || []).forEach((doc) => {
    const type = String(doc.documentType || '').trim();
    if (type && !latestDocByType.has(type)) latestDocByType.set(type, doc);
  });

  if (Array.isArray(compliance.items) && compliance.items.length > 0) {
    checklistEl.innerHTML = compliance.items
      .map((item) => {
        const label = DOCUMENT_TYPE_LABELS[item.documentType] || item.documentType;
        let badge = '<span class="badge badge--green">Complete</span>';
        if (!item.required && item.uploadedCount === 0) {
          badge = '<span class="badge badge--gray">Optional</span>';
        } else if (item.pendingApproval) {
          badge = '<span class="badge badge--yellow">Review Pending</span>';
        } else if (item.missingRequired) {
          badge = '<span class="badge badge--red">Missing</span>';
        } else if (item.missingExpiration) {
          badge = '<span class="badge badge--yellow">Needs Date</span>';
        }
        if (item.kind === 'form') {
          const signedMeta = item.signedDate
            ? `<span style="margin-left:0.5rem;color:var(--color-muted);font-size:0.85rem;">Signed ${escapeHtml(formatDateOnly(item.signedDate))}</span>`
            : '';
          return `<li><span>${escapeHtml(label)}</span><span>${badge}${signedMeta}</span></li>`;
        }
        const latestDoc = latestDocByType.get(item.documentType);
        const viewUrl = latestDoc && latestDoc.fileUrl ? String(latestDoc.fileUrl) : '';
        const viewButton = viewUrl
          ? `<button class="button button--ghost button--sm" type="button" data-checklist-view-url="${escapeHtml(viewUrl)}" style="margin-left:0.5rem;">View Document</button>`
          : `<button class="button button--ghost button--sm" type="button" disabled style="margin-left:0.5rem;">View Document</button>`;
        const uploadButton = canShowChecklistUpload && canAdminUploadChecklistItem(item)
          ? `<button class="button button--ghost button--sm" type="button" data-admin-checklist-upload-type="${escapeHtml(item.documentType)}" data-admin-checklist-upload-label="${escapeHtml(label)}" data-admin-checklist-upload-expiration="${item.requiresExpiration ? '1' : '0'}" style="margin-left:0.5rem;">Upload</button>`
          : '';
        const remindButton = (item.required && (item.missingRequired || item.pendingApproval || item.missingExpiration))
          ? `<button class="button button--ghost button--sm" type="button" data-remind-doc-type="${escapeHtml(item.documentType)}" data-remind-employee-id="${escapeHtml(adminState.selectedEmployeeId)}" style="margin-left:0.5rem;">Send Reminder</button>`
          : '';
        return `<li><span>${escapeHtml(label)}</span><span>${badge}${viewButton}${uploadButton}${remindButton}</span></li>`;
      })
      .join('');
  } else {
    checklistEl.innerHTML = '<li><span>No checklist available.</span><span class="badge badge--gray">N/A</span></li>';
  }

  const docRows = (data.documents || []).map((doc) => {
    const typeLabel = DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType;
    const uploaded = doc.createdAt ? formatDateOnly(doc.createdAt) : 'N/A';
    const uploadedBy = String(doc.uploadedByRole || '').toLowerCase() === 'admin' ? 'Admin' : 'Employee';
    const fileName = doc.fileUrl
      ? `<a class="link" href="${escapeHtml(doc.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(doc.originalName || 'View file')}</a>`
      : escapeHtml(doc.originalName || 'N/A');
    const docStatus = doc.documentStatus || 'pending';
    const statusCls = docStatus === 'approved' ? 'badge--green' : docStatus === 'denied' ? 'badge--red' : 'badge--yellow';
    const statusBdg = `<span class="badge ${statusCls}">${escapeHtml(docStatus)}</span>`;
    const employeeId = adminState.selectedEmployeeId;
    const actions = docStatus === 'approved'
      ? statusBdg
      : `${statusBdg} <button class="button button--sm" style="margin-left:0.4rem;" type="button" data-approve-doc-id="${doc.id}" data-doc-employee-id="${employeeId}">Approve</button> <button class="button button--danger button--sm" type="button" data-deny-doc-id="${doc.id}" data-doc-employee-id="${employeeId}">Deny</button>`;
    return `<tr><td>${escapeHtml(typeLabel)}</td><td>${fileName}</td><td>${escapeHtml(uploaded)}</td><td>${escapeHtml(uploadedBy)}</td><td>${escapeHtml(doc.expirationDate ? formatDateOnly(doc.expirationDate) : 'N/A')}</td><td>${actions}</td></tr>`;
  });

  setTableRows('adminEmployeeDocuments', docRows, 6, 'No documents uploaded yet.');

  const taxRows = [];
  const onboardingFormRows = [];
  const canViewTaxDetails = Boolean(document.getElementById('adminTaxFormDetailPanel'));
  if (data.w4Form) {
    const detailButton = canViewTaxDetails ? ` <button class="button button--ghost button--sm" type="button" data-tax-form-details="w4">View Details</button>` : '';
    taxRows.push(`<tr><td>W-4${detailButton}</td><td>${escapeHtml(data.w4Form.legalName || 'N/A')}</td><td>N/A</td><td>${escapeHtml(data.w4Form.signedDate ? formatDateOnly(data.w4Form.signedDate) : 'N/A')}</td><td>${escapeHtml(data.w4Form.updatedAt ? formatDateOnly(data.w4Form.updatedAt) : 'N/A')}</td></tr>`);
  }
  if (data.w9Form) {
    const detailButton = canViewTaxDetails ? ` <button class="button button--ghost button--sm" type="button" data-tax-form-details="w9">View Details</button>` : '';
    taxRows.push(`<tr><td>W-9${detailButton}</td><td>${escapeHtml(data.w9Form.name || 'N/A')}</td><td>${escapeHtml(data.w9Form.tin || 'N/A')}</td><td>${escapeHtml(data.w9Form.signedDate ? formatDateOnly(data.w9Form.signedDate) : 'N/A')}</td><td>${escapeHtml(data.w9Form.updatedAt ? formatDateOnly(data.w9Form.updatedAt) : 'N/A')}</td></tr>`);
  }
  setTableRows('adminEmployeeTaxForms', taxRows, 5, 'No tax forms submitted yet.');

  const taxDetailPanel = document.getElementById('adminTaxFormDetailPanel');
  const taxDetailBody = document.getElementById('adminTaxFormDetailBody');
  const taxDetailMsg = document.getElementById('adminTaxFormDetailMessage');
  if (taxDetailPanel) taxDetailPanel.hidden = true;
  if (taxDetailBody) taxDetailBody.innerHTML = '';
  if (taxDetailMsg) setMessage(taxDetailMsg, 'Select a tax form to review.', 'neutral');

  if (data.backgroundConsentForm) {
    const backgroundNoticeUrl = getSignedOnboardingFormUrl('background-consent', employee.id);
    onboardingFormRows.push(`<tr><td>Background Consent</td><td>${escapeHtml(data.backgroundConsentForm.legalName || 'N/A')}</td><td>${escapeHtml(data.backgroundConsentForm.signatureName || 'N/A')}</td><td>${escapeHtml(data.backgroundConsentForm.signedDate ? formatDateOnly(data.backgroundConsentForm.signedDate) : 'N/A')}</td><td>${escapeHtml(data.backgroundConsentForm.updatedAt ? formatDateOnly(data.backgroundConsentForm.updatedAt) : 'N/A')}</td><td><button class="button button--ghost button--sm" type="button" data-onboarding-form-details="background-consent">View Details</button> <a class="link" href="${escapeHtml(backgroundNoticeUrl)}" target="_blank" rel="noopener">View Notice</a></td></tr>`);
  }
  if (data.hipaaComplianceForm) {
    const hipaaNoticeUrl = getSignedOnboardingFormUrl('hipaa-compliance', employee.id);
    onboardingFormRows.push(`<tr><td>HIPAA Compliance</td><td>${escapeHtml(data.hipaaComplianceForm.legalName || 'N/A')}</td><td>${escapeHtml(data.hipaaComplianceForm.signatureName || 'N/A')}</td><td>${escapeHtml(data.hipaaComplianceForm.signedDate ? formatDateOnly(data.hipaaComplianceForm.signedDate) : 'N/A')}</td><td>${escapeHtml(data.hipaaComplianceForm.updatedAt ? formatDateOnly(data.hipaaComplianceForm.updatedAt) : 'N/A')}</td><td><button class="button button--ghost button--sm" type="button" data-onboarding-form-details="hipaa-compliance">View Details</button> <a class="link" href="${escapeHtml(hipaaNoticeUrl)}" target="_blank" rel="noopener">View Notice</a></td></tr>`);
  }
  if (data.handbookForm) {
    const handbookNoticeUrl = getSignedOnboardingFormUrl('employee-handbook', employee.id);
    onboardingFormRows.push(`<tr><td>Employee Handbook</td><td>${escapeHtml(data.handbookForm.legalName || 'N/A')}</td><td>${escapeHtml(data.handbookForm.signatureName || 'N/A')}</td><td>${escapeHtml(data.handbookForm.signedDate ? formatDateOnly(data.handbookForm.signedDate) : 'N/A')}</td><td>${escapeHtml(data.handbookForm.updatedAt ? formatDateOnly(data.handbookForm.updatedAt) : 'N/A')}</td><td><button class="button button--ghost button--sm" type="button" data-onboarding-form-details="employee-handbook">View Details</button> <a class="link" href="${escapeHtml(handbookNoticeUrl)}" target="_blank" rel="noopener">View Notice</a></td></tr>`);
  }
  if (data.compensationAgreementForm) {
    const compNoticeUrl = getSignedOnboardingFormUrl('compensation-agreement', employee.id);
    onboardingFormRows.push(`<tr><td>Employee Compensation Agreement</td><td>${escapeHtml(data.compensationAgreementForm.legalName || 'N/A')}</td><td>${escapeHtml(data.compensationAgreementForm.signatureName || 'N/A')}</td><td>${escapeHtml(data.compensationAgreementForm.signedDate ? formatDateOnly(data.compensationAgreementForm.signedDate) : 'N/A')}</td><td>${escapeHtml(data.compensationAgreementForm.updatedAt ? formatDateOnly(data.compensationAgreementForm.updatedAt) : 'N/A')}</td><td><button class="button button--ghost button--sm" type="button" data-onboarding-form-details="compensation-agreement">View Details</button> <a class="link" href="${escapeHtml(compNoticeUrl)}" target="_blank" rel="noopener">View Notice</a></td></tr>`);
  }
  setTableRows('adminEmployeeOnboardingForms', onboardingFormRows, 6, 'No onboarding forms submitted yet.');

  const onboardingDetailPanel = document.getElementById('adminOnboardingFormDetailPanel');
  const onboardingDetailBody = document.getElementById('adminOnboardingFormDetailBody');
  const onboardingDetailMsg = document.getElementById('adminOnboardingFormDetailMessage');
  if (onboardingDetailPanel) onboardingDetailPanel.hidden = true;
  if (onboardingDetailBody) onboardingDetailBody.innerHTML = '';
  if (onboardingDetailMsg) setMessage(onboardingDetailMsg, 'Select an onboarding form to review.', 'neutral');

  const bgSelect = document.getElementById('adminEmployeeBackgroundStatus');
  if (bgSelect) {
    const currentStatus = String(employee.backgroundStatus || '').toLowerCase();
    bgSelect.value = currentStatus === 'passed' ? 'passed' : 'needs_further_attention';
  }

  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error('Error rendering employee detail:', error);
    const msg = document.getElementById('adminEmployeeDetailMessage');
    if (msg) setMessage(msg, `Error: ${error.message || 'Failed to render employee profile.'}`, 'error');
  }
}

async function loadAdminEmployeeDetail(employeeId) {
  const section = document.getElementById('adminEmployeeDetailSection');
  const msg = document.getElementById('adminEmployeeDetailMessage');

  if (!section || !msg) return;

  section.hidden = false;
  openPortalDrawerById('adminEmployeeDetailSection');
  setMessage(msg, 'Loading employee profile...', 'success');

  try {
    const profileRes = await apiFetch(`${getScopedEmployeeApiBasePath()}/${employeeId}/profile`);

    if (!profileRes.ok) {
      const data = await profileRes.json().catch(() => ({}));
      setMessage(msg, data.error || 'Failed to load employee profile.', 'error');
      return;
    }

    const payload = await profileRes.json();
    adminState.selectedEmployeeId = employeeId;
    adminState.selectedEmployeeDetail = payload;
    renderAdminEmployeeDetail(payload);
  } catch (error) {
    console.error('Error loading employee detail:', error);
    setMessage(msg, `Error: ${error.message || 'Failed to load employee profile.'}`, 'error');
  }
}

function getScopedEmployeeApiBasePath() {
  const pageType = String(document.body?.dataset?.portalPage || '').trim().toLowerCase();
  if (pageType === 'onboarding') {
    return '/api/portal/onboarding/employees';
  }
  return '/api/admin/employees';
}

function renderAdminTimesheetsSection() {
  const filterValue = asInt(document.getElementById('adminTimesheetEmployeeFilter')?.value || '');
  const statusValue = String(document.getElementById('adminTimesheetStatusFilter')?.value || '').trim().toLowerCase();
  const sourceValue = String(document.getElementById('adminTimesheetSourceFilter')?.value || '').trim().toLowerCase();
  const filteredTimesheets = adminState.timesheets.filter((timesheet) => {
    const employeeMatch = Number.isInteger(filterValue) && filterValue > 0
      ? Number(timesheet.employeeUserId) === filterValue
      : true;
    const statusMatch = statusValue ? String(timesheet.status || '').trim().toLowerCase() === statusValue : true;
    const sourceMatch = sourceValue ? String(timesheet.source || '').trim().toLowerCase() === sourceValue : true;
    return employeeMatch && statusMatch && sourceMatch;
  });

  const rows = filteredTimesheets.map((ts) => {
    const period = formatDateRange(ts.periodStart, ts.periodEnd);
    const statusCls = ts.status === 'approved' ? 'badge--green' : 'badge--yellow';
    const statusLabel = ts.status === 'approved' ? 'Approved' : 'Pending Approval';
    const badge = `<span class="badge ${statusCls}">${escapeHtml(statusLabel)}</span>`;
    const sourceLabel = ts.source === 'paper' ? 'Paper Upload' : ts.source === 'manual' ? 'Manual Entry' : 'Clock';
    const sourceBadgeCls = ts.source === 'paper' ? 'badge--gray' : ts.source === 'manual' ? 'badge--yellow' : 'badge--green';
    const sourceBadge = `<span class="badge ${sourceBadgeCls}">${escapeHtml(sourceLabel)}</span>`;
    const sig = ts.approvedAt
      ? `${escapeHtml(ts.approvalSignature || '')} <span style="font-size:0.78rem;color:var(--color-muted)">(${escapeHtml(formatDateOnly(ts.approvedAt))})</span>`
      : '—';
    const submittedBy = ts.submittedBy === 'admin' ? 'Admin' : 'Employee';
    const viewBtn = `<button class="button button--ghost button--sm" type="button" data-admin-ts-view-id="${ts.id}">View</button>`;
    const fileBtn = ts.paperFileUrl ? ` <a class="button button--ghost button--sm" href="${escapeHtml(ts.paperFileUrl)}" target="_blank" rel="noopener">File</a>` : '';
    return `<tr><td>${escapeHtml(ts.employeeName || '—')}</td><td>${period}</td><td>${escapeHtml(ts.jobTitle || '—')}${ts.statPayEnabled ? `<br>${statPayApprovalMarkup(ts)}` : ''}</td><td>${escapeHtml(String(ts.totalHours || 0))} hrs</td><td>${escapeHtml(submittedBy)}</td><td>${sourceBadge}</td><td>${badge}</td><td>${sig}</td><td>${viewBtn}${fileBtn}</td></tr>`;
  });

  setTableRows('adminTimesheetsTbody', rows, 9, 'No timesheets on record.');
  populateTimesheetExportPeriodOptions('adminTimesheetExportPeriod', filteredTimesheets);

  const section = document.getElementById('adminTimesheetsSection');
  if (section) section._timesheets = adminState.timesheets;

  const container = document.getElementById('adminManualTsEntriesContainer');
  if (container && container.children.length === 0) {
    addAdminManualTsEntryRow(container);
  }
}

function renderAdminExcuseFormsSection() {
  const rows = (adminState.excuseForms || []).map((item) => {
    const typeLabel = String(item.cancellationType || '') === 'medical' ? 'Medical' : 'Non-Medical';
    let doctorNote;
    if (item.doctorNoteFileUrl) {
      const ackBadge = item.doctorNoteAcknowledged
        ? '<span class="badge badge--green" style="font-size:0.7rem;margin-left:0.25rem;">Acknowledged</span>'
        : '';
      doctorNote = `<a class="link" href="${escapeHtml(item.doctorNoteFileUrl)}" target="_blank" rel="noopener">${escapeHtml(item.doctorNoteName || 'View note')}</a>${ackBadge}`;
    } else if (item.submittedAsNcns && String(item.cancellationType || '') === 'medical') {
      doctorNote = '<span class="badge badge--red">Doctor\'s Note Not Provided</span>';
    } else {
      doctorNote = '<span class="badge badge--gray">Not Uploaded</span>';
    }
    const status = statusBadge(item.status || 'pending');
    const requiresAction = String(item.status || '').toLowerCase() === 'pending';
    const action = requiresAction
      ? `<button class="button button--sm" type="button" data-admin-approve-excuse-id="${escapeHtml(item.id)}">Approve & Sign</button> <button class="button button--danger button--sm" type="button" data-admin-deny-excuse-id="${escapeHtml(item.id)}">Deny</button>`
      : `<span class="badge badge--gray">${escapeHtml(item.adminSignature || 'Reviewed')}</span>`;

    return `<tr><td>${escapeHtml(item.employeeName || '—')}</td><td>${escapeHtml(item.jobTitle || '—')}${item.jobSchedule ? `<br><span style="font-size:0.78rem;color:var(--color-muted);">${escapeHtml(item.jobSchedule)}</span>` : ''}</td><td>${escapeHtml(typeLabel)}</td><td>${escapeHtml(item.reason || '—')}</td><td>${doctorNote}</td><td>${status}</td><td>${action}</td></tr>`;
  });

  setTableRows('adminExcuseFormsTbody', rows, 7, 'No excuse forms submitted yet.');
}

function populateAdminTimesheetEmployeeOptions() {
  const filterSelect = document.getElementById('adminTimesheetEmployeeFilter');
  if (filterSelect) {
    const currentVal = filterSelect.value;
    filterSelect.innerHTML = '<option value="">All employees</option>' +
      adminState.employees.map((employee) => `<option value="${employee.userId || employee.id}">${escapeHtml(`${employee.name} (${employee.email})`)}</option>`).join('');
    if (currentVal) filterSelect.value = currentVal;
  }

  const manualEmployeeSelect = document.getElementById('adminManualTsEmployee');
  if (manualEmployeeSelect) {
    const currentVal = manualEmployeeSelect.value;
    const activeEmployees = adminState.employees.filter((employee) => employee.onboardingStatus === 'active');
    manualEmployeeSelect.innerHTML = '<option value="">Select employee…</option>' +
      activeEmployees.map((employee) => `<option value="${employee.userId || employee.id}">${escapeHtml(`${employee.name} (${employee.email})`)}</option>`).join('');
    if (currentVal) manualEmployeeSelect.value = currentVal;
  }
}

function populateAdminManualTimesheetAssignments(assignments = [], employeeId = null) {
  const assignSel = document.getElementById('adminManualTsAssignment');
  if (!assignSel) return;
  assignSel.innerHTML = '<option value="">Select assignment…</option>' +
    assignments.map((assignment) => `<option value="${assignment.id}" data-job-id="${assignment.jobId}" data-jobsite-user-id="${assignment.jobsiteUserId || ''}" data-employee-user-id="${employeeId || ''}">${escapeHtml(assignment.title || `Assignment ${assignment.id}`)} — ${escapeHtml(assignment.companyName || 'Progress Staffing')}</option>`).join('');
}

async function loadAdminManualTimesheetAssignments(employeeId) {
  const assignSel = document.getElementById('adminManualTsAssignment');
  const msg = document.getElementById('adminManualTimesheetMessage');
  if (msg) hideMessage(msg);

  if (!assignSel) return;
  if (!Number.isInteger(employeeId) || employeeId < 1) {
    adminState.selectedTimesheetEmployeeId = null;
    populateAdminManualTimesheetAssignments([], null);
    return;
  }

  adminState.selectedTimesheetEmployeeId = employeeId;
  assignSel.innerHTML = '<option value="">Loading assignments…</option>';

  try {
    const res = await apiFetch(`/api/admin/employees/${employeeId}/timesheets`);
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      populateAdminManualTimesheetAssignments([], employeeId);
      if (msg) setMessage(msg, payload.error || 'Failed to load assignments for the selected employee.', 'error');
      return;
    }
    populateAdminManualTimesheetAssignments(payload.assignments || [], employeeId);
  } catch (error) {
    populateAdminManualTimesheetAssignments([], employeeId);
    if (msg) setMessage(msg, error.message || 'Failed to load assignments for the selected employee.', 'error');
  }
}

function showAdminTimesheetEntries(timesheetId, timesheets = []) {
  const panel = document.getElementById('adminTimesheetEntriesPanel');
  const titleEl = document.getElementById('adminTimesheetEntriesTitle');
  const tbody = document.getElementById('adminTimesheetEntriesTbody');
  if (!panel || !tbody) return;

  const timesheet = timesheets.find((item) => Number(item.id) === Number(timesheetId));
  if (!timesheet) return;

  titleEl && (titleEl.textContent = `Time Entries — ${formatDateOnly(timesheet.periodStart || '')} to ${formatDateOnly(timesheet.periodEnd || '')} (${timesheet.totalHours || 0} hrs)`);
  let entries = [];
  try { entries = JSON.parse(timesheet.entriesJson || '[]'); } catch {}
  tbody.innerHTML = entries.map((entry, index) => {
    const type = entry.type === 'manual'
      ? '<span class="badge badge--yellow">Manual</span>'
      : entry.type === 'paper'
        ? '<span class="badge badge--gray">Paper</span>'
        : '<span class="badge badge--green">Clock</span>';
    const notes = entry.notes ? escapeHtml(entry.notes) : '';
    return `<tr><td>${index + 1}</td><td>${escapeHtml(entry.date ? formatDateOnly(entry.date) : formatDateOnly(entry.clockIn || ''))}</td><td>${escapeHtml(formatDateTime(entry.clockIn))}</td><td>${escapeHtml(formatDateTime(entry.clockOut))}</td><td>${escapeHtml(String(entry.hours || 0))} hrs</td><td>${type}</td><td>${notes}</td></tr>`;
  }).join('') || '<tr><td colspan="7">No entries.</td></tr>';
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function addAdminManualTsEntryRow(container) {
  const rowIdx = container.children.length;
  const row = document.createElement('div');
  row.className = 'admin-ts-entry-row';
  row.style.cssText = 'display:grid;gap:0.7rem;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:0.7rem;padding:0.7rem;border:1px solid var(--color-border);border-radius:8px;';
  row.innerHTML = `
    <div class="form-row" style="margin:0;">
      <label style="font-size:0.85rem;">Date</label>
      <input type="date" class="ts-manual-date" />
    </div>
    <div class="form-row" style="margin:0;">
      <label style="font-size:0.85rem;">Clock In</label>
      <input type="text" class="ts-manual-clock-in" placeholder="h:mm AM/PM" autocomplete="off" />
    </div>
    <div class="form-row" style="margin:0;">
      <label style="font-size:0.85rem;">Clock Out</label>
      <input type="text" class="ts-manual-clock-out" placeholder="h:mm AM/PM" autocomplete="off" />
    </div>
    <div class="form-row" style="margin:0;">
      <label style="font-size:0.85rem;">Notes</label>
      <input type="text" class="ts-manual-entry-notes" placeholder="Optional" />
    </div>
    ${rowIdx > 0 ? `<div style="display:flex;align-items:flex-end;padding-bottom:0.2rem;"><button type="button" class="button button--ghost button--sm ts-remove-entry-btn" style="color:var(--color-danger,#ef4444);">Remove</button></div>` : ''}
  `;
  container.appendChild(row);
  // Bind remove button
  const removeBtn = row.querySelector('.ts-remove-entry-btn');
  if (removeBtn) removeBtn.addEventListener('click', () => row.remove());
}

function renderAdminTables() {
  renderAdminUsersTable();
  renderAdminJobsTable();
  renderAdminEmployeesTable();
}

function populateAdminDropdowns() {
  const jobSel = document.getElementById('adminAssignJobId');
  if (jobSel) {
    const currentVal = jobSel.value;
    jobSel.innerHTML = '<option value="">Select a job\u2026</option>' +
      (adminState.jobs.map(j => `<option value="${j.id}">${escapeHtml(`#${j.id} ${j.title} (${j.companyName || j.jobsiteName || 'N/A'})`)}</option>`).join('') || '<option disabled>No jobs available</option>');
    if (currentVal) jobSel.value = currentVal;
  }

  const empSel = document.getElementById('adminAssignEmployeeId');
  if (empSel) {
    const currentVal = empSel.value;
    const activeEmployees = adminState.employees.filter((employee) => employee.onboardingStatus === 'active');
    empSel.innerHTML = '<option value="">Select an employee\u2026</option>' +
      (activeEmployees.map(e => `<option value="${e.userId || e.id}">${escapeHtml(`${e.name} (${e.email})`)}</option>`).join('') || '<option disabled>No active employees available</option>');
    if (currentVal) empSel.value = currentVal;
  }

}

function renderAdminDashboard(dashboard, usersPayload, jobsPayload, employeesPayload, documentsPayload, assignmentsPayload, timesheetsPayload, excuseFormsPayload) {
  const greeting = document.getElementById('portalGreeting');
  if (greeting) {
    const adminName = String(dashboard.user?.name || 'Administrator').trim();
    greeting.textContent = `Welcome ${adminName}`;
  }
  
  const industry = document.getElementById('portalIndustry');
  if (industry) {
    const scope = String(dashboard.user?.portalScope || 'full').toLowerCase();
    let scopeLabel = 'Full Access';
    if (scope === 'onboarding') scopeLabel = 'Onboarding';
    if (scope === 'scheduling') scopeLabel = 'Scheduling';
    if (scope === 'contracts') scopeLabel = 'Contracts';
    industry.textContent = scopeLabel;
  }

  populateAccountIdentityFields(dashboard.user, {
    nameFieldId: 'adminAccountName',
    userIdFieldId: 'adminAccountUserId',
    emailFieldId: 'adminAccountEmail',
    passwordStatusFieldId: 'adminAccountPasswordStatus',
    notifyEmailFieldId: 'adminNotifyEmailEnabled',
    notifySmsFieldId: 'adminNotifySmsEnabled',
    notifyPushFieldId: 'adminNotifyPushEnabled',
  });

  setText('statTotalUsers', dashboard.stats.totalUsers);
  setText('statEmployees', dashboard.stats.employees);
  setText('statJobsites', dashboard.stats.jobsites);
  setText('statOpenJobs', dashboard.stats.jobsOpen);
  setText('statApplications', dashboard.stats.applications);

  adminState.users = usersPayload.data || [];
  adminState.jobs = jobsPayload.data || [];
  adminState.employees = employeesPayload.data || [];
  adminState.documents = documentsPayload.data || [];
  adminState.assignments = assignmentsPayload.data || [];
  adminState.timesheets = timesheetsPayload.timesheets || [];
  adminState.excuseForms = excuseFormsPayload.data || [];
  adminState.currentAdminId = dashboard.user?.id || null;

  renderAdminTables();
  populateAdminDropdowns();
  populateAdminTimesheetEmployeeOptions();
  renderAdminTimesheetsSection();
  renderAdminExcuseFormsSection();
}

function clearAdminDashboardLoadMessages() {
  hideMessage(document.getElementById('adminDashboardMessage'));
  hideMessage(document.getElementById('adminUserMessage'));
}

function buildAdminDashboardFallback(user) {
  return {
    user: user || null,
    stats: {
      totalUsers: '—',
      employees: '—',
      jobsites: '—',
      jobsOpen: '—',
      applications: '—',
    },
  };
}

function applyAdminDashboardFailureState(failures = {}) {
  const dashboardMsg = document.getElementById('adminDashboardMessage');
  const userMsg = document.getElementById('adminUserMessage');
  const failureEntries = Object.entries(failures);

  if (!failureEntries.length) {
    clearAdminDashboardLoadMessages();
    return;
  }

  if (failures.dashboard) {
    setText('statTotalUsers', '—');
    setText('statEmployees', '—');
    setText('statJobsites', '—');
    setText('statOpenJobs', '—');
    setText('statApplications', '—');
  }

  if (failures.users) {
    setTableRows('adminUsersTbody', [], 9, 'Unable to load users right now.');
    if (userMsg) setMessage(userMsg, failures.users.message || 'Unable to load users right now.', 'error');
  } else if (userMsg) {
    hideMessage(userMsg);
  }

  if (failures.employees) {
    setTableRows('adminEmployeesTbody', [], 8, 'Unable to load employees right now.');
  }
  if (failures.jobs) {
    setTableRows('adminJobsTbody', [], 10, 'Unable to load shifts right now.');
  }
  if (failures.timesheets) {
    setTableRows('adminTimesheetsTbody', [], 9, 'Unable to load timesheets right now.');
  }
  if (failures.excuseForms) {
    setTableRows('adminExcuseFormsTbody', [], 7, 'Unable to load excuse forms right now.');
  }

  if (dashboardMsg) {
    const summary = failureEntries
      .map(([key, details]) => `${key}: ${details.message || 'Request failed.'}`)
      .join(' | ');
    setMessage(dashboardMsg, `Some admin data could not be loaded. ${summary}`, 'error');
  }
}

async function loadEmployeeDashboard(user) {
  const res = await apiFetch('/api/portal/employee/dashboard');
  if (!res.ok) {
    redirectToUserHome(user, 'loadEmployeeDashboard', { status: res.status });
    return;
  }
  const data = await res.json();
  renderEmployeeDashboard(data);

  // Seed SSN on-file display
  const ssnOnFileDisplay = document.getElementById('employeeSsnOnFileDisplay');
  if (ssnOnFileDisplay) {
    ssnOnFileDisplay.style.display = data.ssnOnFile ? 'block' : 'none';
  }

  const miscDocs = await loadEmployeeMiscDocs();
  renderEmployeeMiscDocs(miscDocs);
}

async function handleEmployeeShiftDecision(currentUser, shiftId, action) {
  const msg = document.getElementById('employeeOpenShiftMessage');
  hideMessage(msg);

  if (action === 'accept' && employeeOnboardingStatus !== 'active') {
    setMessage(msg, getEmployeeOnboardingBlockMessage(employeeCompliance, 'accept shifts'), 'error');
    return;
  }

  const credential = resolveCredential(`${action} this shift`, msg);
  if (credential === null || credential === '') return;

  const res = await apiFetch(`/api/shifts/${shiftId}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    setMessage(msg, data.error || `Failed to ${action} shift.`, 'error');
    return;
  }

  setMessage(msg, action === 'accept' ? 'Shift accepted successfully.' : 'Shift declined. It has been reopened for other matching employees.', 'success');
  await loadEmployeePortalData(currentUser);
}

async function handleEmployeeAssignmentWithdraw(currentUser, assignmentId, scheduleText = '', shiftTitle = 'this shift') {
  const msg = document.getElementById('employeeCurrentShiftMessage') || document.getElementById('employeeShiftOfferMessage');
  const panel = document.getElementById('employeeShiftCancelPanel');
  const panelMsg = document.getElementById('employeeShiftCancelMessage');
  const assignmentInput = document.getElementById('employeeShiftCancelAssignmentId');
  const typeInput = document.getElementById('employeeShiftCancelType');
  const reasonInput = document.getElementById('employeeShiftCancelReason');
  const noteInput = document.getElementById('employeeShiftCancelDoctorNote');
  hideMessage(msg);
  hideMessage(panelMsg);

  if (employeeOnboardingStatus !== 'active') {
    setMessage(msg, getEmployeeOnboardingBlockMessage(employeeCompliance, 'withdraw from assigned shifts'), 'error');
    return;
  }

  const shiftStart = parseShiftStartFromScheduleText(scheduleText);
  if (shiftStart && Date.now() >= shiftStart.getTime()) {
    setMessage(msg, 'This shift has already started. Employees can no longer cancel after start time.', 'error');
    return;
  }

  if (!panel || !assignmentInput || !typeInput || !reasonInput || !noteInput) {
    setMessage(msg, 'Cancellation form is unavailable. Please refresh the page.', 'error');
    return;
  }

  assignmentInput.value = String(assignmentId);
  typeInput.value = 'non_medical';
  reasonInput.value = '';
  noteInput.value = '';
  panel.style.display = 'block';
  reasonInput.focus();
  setMessage(panelMsg, `Complete cancellation details for ${shiftTitle}.`, 'success');
}

async function submitEmployeeAssignmentWithdraw(currentUser) {
  const msg = document.getElementById('employeeCurrentShiftMessage') || document.getElementById('employeeShiftOfferMessage');
  const panel = document.getElementById('employeeShiftCancelPanel');
  const panelMsg = document.getElementById('employeeShiftCancelMessage');
  const assignmentInput = document.getElementById('employeeShiftCancelAssignmentId');
  const typeInput = document.getElementById('employeeShiftCancelType');
  const reasonInput = document.getElementById('employeeShiftCancelReason');
  const noteInput = document.getElementById('employeeShiftCancelDoctorNote');
  const submitBtn = document.getElementById('employeeShiftCancelSubmitBtn');

  if (!panel || !assignmentInput || !typeInput || !reasonInput || !noteInput || !submitBtn) {
    if (msg) setMessage(msg, 'Cancellation form is unavailable. Please refresh the page.', 'error');
    return;
  }

  if (employeeOnboardingStatus !== 'active') {
    if (msg) setMessage(msg, getEmployeeOnboardingBlockMessage(employeeCompliance, 'withdraw from assigned shifts'), 'error');
    return;
  }

  hideMessage(msg);
  hideMessage(panelMsg);

  const assignmentId = asInt(assignmentInput.value);
  const cancellationType = String(typeInput.value || '').trim().toLowerCase();
  const reason = String(reasonInput.value || '').trim();
  if (!Number.isInteger(assignmentId) || assignmentId < 1) {
    setMessage(panelMsg, 'Select a valid shift to cancel.', 'error');
    return;
  }
  if (!['medical', 'non_medical'].includes(cancellationType)) {
    setMessage(panelMsg, 'Cancellation type must be medical or non_medical.', 'error');
    return;
  }
  if (!reason) {
    setMessage(panelMsg, 'A cancellation reason is required.', 'error');
    return;
  }

  const credential = resolveCredential('withdraw from this shift', panelMsg);
  if (credential === null || credential === '') return;

  const formData = new FormData();
  formData.append('credential', credential);
  formData.append('reason', reason);
  formData.append('cancellationType', cancellationType);
  if (noteInput.files && noteInput.files[0]) {
    formData.append('doctorNote', noteInput.files[0]);
  }

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Submitting...';

  const res = await apiFetch(`/api/shifts/assignments/${assignmentId}/withdraw`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  submitBtn.disabled = false;
  submitBtn.textContent = originalText;

  if (!res.ok) {
    setMessage(panelMsg, data.error || 'Failed to withdraw from shift.', 'error');
    return;
  }

  panel.style.display = 'none';
  assignmentInput.value = '';
  reasonInput.value = '';
  noteInput.value = '';
  setMessage(msg, 'Shift withdrawn and reposted to matching employees.', 'success');
  await loadEmployeePortalData(currentUser);
}

async function handleEmployeeShiftOffer(currentUser, assignmentId, shiftTitle) {
  const msg = document.getElementById('employeeShiftOfferMessage');
  hideMessage(msg);

  if (employeeOnboardingStatus !== 'active') {
    setMessage(msg, getEmployeeOnboardingBlockMessage(employeeCompliance, 'privately offer shifts'), 'error');
    return;
  }

  const recipientEmail = window.prompt(`Enter the email address of the employee you want to privately offer "${shiftTitle}" to:`);
  if (recipientEmail === null) return;
  if (!recipientEmail.trim()) {
    setMessage(msg, 'Recipient email is required.', 'error');
    return;
  }

  const credential = resolveCredential('offer this shift', msg);
  if (credential === null || credential === '') return;

  const res = await apiFetch(`/api/shifts/assignments/${assignmentId}/offer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail: recipientEmail.trim(), credential }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    setMessage(msg, data.error || 'Failed to offer shift.', 'error');
    return;
  }

  setMessage(msg, 'Shift offer sent privately.', 'success');
  await loadEmployeeShiftData();
}

async function handleEmployeeOfferResponse(currentUser, offerId, action) {
  const msg = document.getElementById('employeeShiftOfferMessage');
  hideMessage(msg);

  if (action === 'accept' && employeeOnboardingStatus !== 'active') {
    setMessage(msg, getEmployeeOnboardingBlockMessage(employeeCompliance, 'accept private shift offers'), 'error');
    return;
  }

  const credential = resolveCredential(`${action} this shift offer`, msg);
  if (credential === null || credential === '') return;

  const res = await apiFetch(`/api/shifts/offers/${offerId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, credential }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    setMessage(msg, data.error || 'Failed to respond to shift offer.', 'error');
    return;
  }

  setMessage(msg, action === 'accept' ? 'Shift offer accepted.' : 'Shift offer declined.', 'success');
  await loadEmployeePortalData(currentUser);
}

async function handleEmployeeNotificationIntent(currentUser) {
  const params = new URLSearchParams(window.location.search);
  const task = String(params.get('task') || '').trim().toLowerCase();
  const shiftAction = params.get('shiftAction');
  const shiftId = asInt(params.get('shiftId'));
  const offerAction = params.get('offerAction');
  const offerId = asInt(params.get('offerId'));

  if (task === 'timesheets' || task === 'timesheet-review' || task === 'timesheet_reminder') {
    const timesheetSection = document.querySelector('[data-tile-title="Submit Timesheet"]')
      || document.getElementById('employeeTimesheetsTbody')?.closest('.portal-section');
    if (timesheetSection) {
      timesheetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (Number.isInteger(shiftId) && ['accept', 'decline'].includes(shiftAction || '')) {
    await handleEmployeeShiftDecision(currentUser, shiftId, shiftAction);
  }

  if (Number.isInteger(offerId) && ['accept', 'decline'].includes(offerAction || '')) {
    await handleEmployeeOfferResponse(currentUser, offerId, offerAction);
  }

  clearUrlParams(['task', 'periodStart', 'periodEnd', 'shiftAction', 'shiftId', 'offerAction', 'offerId']);
}

function bindEmployeeForms(currentUser) {
  const applicationsTbody = document.getElementById('employeeApplications');
  const openShiftsTbody = document.getElementById('employeeOpenShifts');
  const currentAssignments = document.getElementById('employeeCurrentAssignments');
  const offersTbody = document.getElementById('employeeShiftOffers');
  const checklistEl = document.getElementById('employeeChecklist');
  const trainingSection = document.getElementById('employeeTrainingSection');
  const clockInBtn = document.getElementById('employeeClockInBtn');
  const clockOutBtn = document.getElementById('employeeClockOutBtn');
  const clockAssignmentSelect = document.getElementById('employeeClockAssignment');
  const clockMsg = document.getElementById('employeeClockMessage');
  const cancelPanel = document.getElementById('employeeShiftCancelPanel');
  const cancelSubmitBtn = document.getElementById('employeeShiftCancelSubmitBtn');
  const cancelCloseBtn = document.getElementById('employeeShiftCancelCloseBtn');
  const cancelPanelMsg = document.getElementById('employeeShiftCancelMessage');
  const cancelAssignmentId = document.getElementById('employeeShiftCancelAssignmentId');
  const cancelReasonInput = document.getElementById('employeeShiftCancelReason');
  const cancelDoctorNoteInput = document.getElementById('employeeShiftCancelDoctorNote');
  const backgroundUploadBtn = document.getElementById('employeeBackgroundFormUploadBtn');
  const deleteAccountBtn = document.getElementById('employeeDeleteAccountBtn');
  const deleteAccountPassword = document.getElementById('employeeDeletePassword');
  const deleteAccountMsg = document.getElementById('employeeDeleteAccountMessage');
  const profileDisplay = document.getElementById('employeeProfile');
  const profileEditBtn = document.getElementById('employeeProfileEditBtn');
  const profileEditForm = document.getElementById('employeeProfileEditForm');
  const profileEditCancel = document.getElementById('employeeProfileEditCancel');
  const profileEditMsg = document.getElementById('employeeProfileEditMessage');
  const profileEditPhone = document.getElementById('employeeEditPhone');
  const profileEditAddress = document.getElementById('employeeEditAddress');
  const profileEditCity = document.getElementById('employeeEditCity');
  const profileEditState = document.getElementById('employeeEditState');
  const profileEditZip = document.getElementById('employeeEditZip');
  const profileEditSkills = document.getElementById('employeeEditSkills');
  const profileEditCertifications = document.getElementById('employeeEditCertifications');
  const todoSection = document.getElementById('employeeTodosSection');
  const webFormModal = document.getElementById('employeeWebFormModal');
  const webFormModalTitle = document.getElementById('employeeWebFormModalTitle');
  const webFormModalMessage = document.getElementById('employeeWebFormModalMessage');
  const webFormStatus = document.getElementById('employeeWebFormStatus');
  const webFormModalContent = document.getElementById('employeeWebFormModalContent');
  const webFormModalForm = document.getElementById('employeeWebFormModalForm');
  const webFormUnlockPanel = document.getElementById('employeeWebFormUnlockPanel');
  const webFormAcknowledge = document.getElementById('employeeWebFormAcknowledge');
  const webFormAcknowledgeLabel = document.getElementById('employeeWebFormAcknowledgeLabel');
  const webFormLegalName = document.getElementById('employeeWebFormLegalName');
  const webFormSignatureName = document.getElementById('employeeWebFormSignatureName');
  const webFormSignedDate = document.getElementById('employeeWebFormSignedDate');
  const webFormSubmitBtn = document.getElementById('employeeWebFormSubmitBtn');
  const backgroundDisclosureBtn = document.getElementById('employeeBackgroundDisclosureBtn');
  const backgroundDisclosureDownloadBtn = document.getElementById('employeeBackgroundDisclosureDownloadBtn');

  if (profileEditBtn && profileEditForm && profileDisplay && profileEditBtn.dataset.bound !== '1') {
    profileEditBtn.dataset.bound = '1';
    profileEditBtn.addEventListener('click', () => {
      if (profileEditPhone) profileEditPhone.value = formatPhoneForView(profileDisplay.dataset.phone || '', '');
      if (profileEditAddress) profileEditAddress.value = String(profileDisplay.dataset.address || '').trim();
      if (profileEditCity) profileEditCity.value = String(profileDisplay.dataset.city || '').trim();
      if (profileEditState) profileEditState.value = String(profileDisplay.dataset.state || '').trim();
      if (profileEditZip) profileEditZip.value = String(profileDisplay.dataset.zip || '').trim();
      if (profileEditSkills) profileEditSkills.value = String(profileDisplay.dataset.skills || '').trim();
      if (profileEditCertifications) profileEditCertifications.value = String(profileDisplay.dataset.certifications || '').trim();

      profileDisplay.hidden = true;
      profileEditForm.hidden = false;
      hideMessage(profileEditMsg);
    });
  }

  if (profileEditCancel && profileEditForm && profileDisplay && profileEditCancel.dataset.bound !== '1') {
    profileEditCancel.dataset.bound = '1';
    profileEditCancel.addEventListener('click', () => {
      profileEditForm.hidden = true;
      profileDisplay.hidden = false;
      hideMessage(profileEditMsg);
    });
  }

  if (profileEditForm && profileEditForm.dataset.bound !== '1') {
    profileEditForm.dataset.bound = '1';
    profileEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideMessage(profileEditMsg);

      const payload = {
        phone: String(profileEditPhone?.value || '').trim(),
        address: String(profileEditAddress?.value || '').trim(),
        city: String(profileEditCity?.value || '').trim(),
        state: String(profileEditState?.value || '').trim().toUpperCase(),
        zip: String(profileEditZip?.value || '').trim(),
        skills: String(profileEditSkills?.value || '').trim(),
        certifications: String(profileEditCertifications?.value || '').trim(),
      };

      const normalizedPhone = phoneDigits(payload.phone);
      if (payload.phone && normalizedPhone.length !== 10) {
        setMessage(profileEditMsg, 'Phone number must be exactly 10 digits.', 'error');
        return;
      }

      const hasAddressData = Boolean(payload.address || payload.city || payload.state || payload.zip);
      if (hasAddressData && (!payload.address || !payload.city || !payload.state || !payload.zip)) {
        setMessage(profileEditMsg, 'Enter street address, city, state, and ZIP code.', 'error');
        return;
      }

      if (payload.state && !/^[A-Z]{2}$/.test(payload.state)) {
        setMessage(profileEditMsg, 'State must be a 2-letter code (for example, NV).', 'error');
        return;
      }

      if (payload.zip && !/^\d{5}(?:-\d{4})?$/.test(payload.zip)) {
        setMessage(profileEditMsg, 'ZIP code must be 5 digits or ZIP+4 format.', 'error');
        return;
      }

      payload.phone = normalizedPhone;

      const res = await apiFetch('/api/portal/employee/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(profileEditMsg, data.error || 'Failed to update profile.', 'error');
        return;
      }

      setMessage(profileEditMsg, 'Profile updated successfully.', 'success');
      profileEditForm.hidden = true;
      if (profileDisplay) profileDisplay.hidden = false;
      await loadEmployeeDashboard(currentUser);
    });
  }

  if (deleteAccountBtn && deleteAccountBtn.dataset.bound !== '1') {
    deleteAccountBtn.dataset.bound = '1';
    deleteAccountBtn.addEventListener('click', async () => {
      hideMessage(deleteAccountMsg);

      const password = String(deleteAccountPassword?.value || '');
      if (!password.trim()) {
        setMessage(deleteAccountMsg, 'Current password is required to delete your account.', 'error');
        return;
      }

      const confirmed = window.confirm('This will permanently delete your employee account and related records. This action cannot be undone. Continue?');
      if (!confirmed) return;

      deleteAccountBtn.disabled = true;
      const previousText = deleteAccountBtn.textContent;
      deleteAccountBtn.textContent = 'Deleting...';

      try {
        const res = await apiFetch('/api/portal/employee/account', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(deleteAccountMsg, data.error || 'Failed to delete account.', 'error');
          return;
        }

        setMessage(deleteAccountMsg, 'Your account has been deleted. Redirecting...', 'success');
        if (deleteAccountPassword) deleteAccountPassword.value = '';
        clearToken();
        window.setTimeout(() => {
          window.location.href = routeForRole('login');
        }, 700);
      } finally {
        deleteAccountBtn.disabled = false;
        deleteAccountBtn.textContent = previousText;
      }
    });
  }

  function closeEmployeeWebFormModal() {
    if (!webFormModal) return;
    webFormModal.hidden = true;
    webFormModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('portal-webform-modal-open');
    if (webFormModalForm) {
      webFormModalForm.dataset.formKey = '';
    }
    if (webFormModalContent) {
      webFormModalContent.innerHTML = '';
      webFormModalContent.onscroll = null;
    }
    if (webFormUnlockPanel) webFormUnlockPanel.hidden = true;
    if (webFormAcknowledge) webFormAcknowledge.checked = false;
    if (webFormStatus) setMessage(webFormStatus, 'Scroll to the bottom of the form to continue.', 'neutral');
    if (webFormModalMessage) setMessage(webFormModalMessage, 'Scroll through the full form to unlock the acknowledgment and electronic signature fields.', 'neutral');
  }

  function unlockEmployeeWebForm(config) {
    if (webFormUnlockPanel) webFormUnlockPanel.hidden = false;
    if (webFormStatus) setMessage(webFormStatus, config.unlockMessage, 'success');
    if (webFormModalMessage) setMessage(webFormModalMessage, config.unlockMessage, 'success');
  }

  function syncEmployeeWebFormUnlock(config) {
    if (!webFormModalContent || !webFormUnlockPanel) return;
    const distanceFromBottom = webFormModalContent.scrollHeight - webFormModalContent.scrollTop - webFormModalContent.clientHeight;
    const reachedBottom = distanceFromBottom <= 10 || webFormModalContent.scrollHeight <= webFormModalContent.clientHeight + 10;
    if (reachedBottom) {
      unlockEmployeeWebForm(config);
    } else {
      webFormUnlockPanel.hidden = true;
      if (webFormStatus) setMessage(webFormStatus, config.lockedMessage, 'neutral');
      if (webFormModalMessage) setMessage(webFormModalMessage, config.lockedMessage, 'neutral');
    }
  }

  function openEmployeeWebForm(formKey) {
    const config = getEmployeeWebFormConfig(formKey);
    if (!config || !webFormModal || !webFormModalContent || !webFormModalForm) return;

    const template = document.getElementById(config.templateId);
    if (!template) return;

    const formRecord = employeeDashboardPayload && employeeDashboardPayload[config.dataKey]
      ? employeeDashboardPayload[config.dataKey]
      : null;

    if (webFormModalTitle) webFormModalTitle.textContent = config.title;
    if (webFormAcknowledgeLabel) {
      const textSpan = webFormAcknowledgeLabel.querySelector('span');
      if (textSpan) textSpan.textContent = config.acknowledgmentText;
    }
    if (webFormModalContent) webFormModalContent.innerHTML = template.innerHTML;

    // For the compensation agreement, replace the pay rate table with only the employee's role
    if (config.key === 'compensation-agreement' && webFormModalContent && employeeDashboardPayload) {
      const empIndustry = inferPrimaryIndustry(employeeDashboardPayload.applications || []);
      const rateMap = {
        cna: { role: 'CNA \u2014 Certified Nursing Assistant', local: '$25.00\u00a0/\u00a0hr', travel: '$30.00\u00a0/\u00a0hr' },
        cma: { role: 'CMA \u2014 Certified Medication Aide',  local: '$25.00\u00a0/\u00a0hr', travel: '$30.00\u00a0/\u00a0hr' },
        lpn: { role: 'LPN \u2014 Licensed Practical Nurse',  local: '$40.00\u00a0/\u00a0hr', travel: '$50.00\u00a0/\u00a0hr' },
        lvn: { role: 'LVN \u2014 Licensed Vocational Nurse', local: '$40.00\u00a0/\u00a0hr', travel: '$50.00\u00a0/\u00a0hr' },
        rn:  { role: 'RN \u2014 Registered Nurse',           local: '$50.00\u00a0/\u00a0hr', travel: '$60.00\u00a0/\u00a0hr' },
      };
      const rate = rateMap[empIndustry];
      if (rate) {
        const tbody = webFormModalContent.querySelector('.portal-table tbody');
        if (tbody) {
          tbody.innerHTML = `<tr><td>${rate.role}</td><td>${rate.local}</td><td>${rate.travel}</td></tr>`;
        }
      }
    }

    if (webFormLegalName) webFormLegalName.value = (formRecord && formRecord.legalName) || String(portalCurrentUser?.name || '').trim();
    if (webFormSignatureName) webFormSignatureName.value = (formRecord && formRecord.signatureName) || '';
    if (webFormSignedDate) webFormSignedDate.value = (formRecord && formRecord.signedDate) || new Date().toISOString().slice(0, 10);
    if (webFormAcknowledge) webFormAcknowledge.checked = Boolean(formRecord && formRecord.acknowledged);
    if (webFormUnlockPanel) webFormUnlockPanel.hidden = true;
    webFormModalForm.dataset.formKey = config.key;
    if (webFormStatus) setMessage(webFormStatus, config.lockedMessage, 'neutral');
    if (webFormModalMessage) setMessage(webFormModalMessage, config.lockedMessage, 'neutral');

    webFormModal.hidden = false;
    webFormModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('portal-webform-modal-open');

    window.setTimeout(() => {
      syncEmployeeWebFormUnlock(config);
      webFormModalContent.onscroll = () => syncEmployeeWebFormUnlock(config);
      const firstLink = webFormModalContent.querySelector('a, button, input, textarea, select');
      if (firstLink && typeof firstLink.focus === 'function') {
        firstLink.focus({ preventScroll: true });
      }
    }, 0);
  }

  if (todoSection && todoSection.dataset.bound !== '1') {
    todoSection.dataset.bound = '1';
    todoSection.addEventListener('click', (event) => {
      const openBtn = event.target.closest('[data-employee-form-open]');
      if (openBtn) {
        openEmployeeWebForm(openBtn.dataset.employeeFormOpen);
        return;
      }

      const viewBtn = event.target.closest('[data-employee-form-view]');
      if (viewBtn) {
        const formType = String(viewBtn.dataset.employeeFormView || '').trim().toLowerCase();
        if (formType && currentUser && currentUser.id) {
          const viewUrl = getSignedOnboardingFormUrl(formType, currentUser.id);
          window.open(viewUrl, '_blank', 'noopener');
        }
        return;
      }
    });
  }

  if (backgroundDisclosureBtn && backgroundDisclosureBtn.dataset.bound !== '1') {
    backgroundDisclosureBtn.dataset.bound = '1';
    backgroundDisclosureBtn.addEventListener('click', () => openBackgroundDisclosureNotice(false));
  }
  if (backgroundDisclosureDownloadBtn && backgroundDisclosureDownloadBtn.dataset.bound !== '1') {
    backgroundDisclosureDownloadBtn.dataset.bound = '1';
    backgroundDisclosureDownloadBtn.addEventListener('click', () => openBackgroundDisclosureNotice(true));
  }

  if (webFormModal && webFormModal.dataset.bound !== '1') {
    webFormModal.dataset.bound = '1';
    webFormModal.addEventListener('click', (event) => {
      if (event.target.closest('[data-employee-webform-close]') || event.target.id === 'employeeWebFormModalCloseBtn') {
        closeEmployeeWebFormModal();
      }
    });
  }

  if (webFormModalForm && webFormModalForm.dataset.bound !== '1') {
    webFormModalForm.dataset.bound = '1';
    webFormModalForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const config = getEmployeeWebFormConfig(webFormModalForm.dataset.formKey);
      if (!config) return;

      hideMessage(webFormStatus);
      const payload = {
        acknowledged: Boolean(webFormAcknowledge && webFormAcknowledge.checked),
        legalName: String(webFormLegalName?.value || '').trim(),
        signatureName: String(webFormSignatureName?.value || '').trim(),
        signedDate: String(webFormSignedDate?.value || '').trim(),
      };

      if (webFormUnlockPanel && webFormUnlockPanel.hidden) {
        setMessage(webFormStatus, config.lockedMessage, 'error');
        return;
      }

      if (!payload.acknowledged) {
        setMessage(webFormStatus, 'You must acknowledge the form before signing.', 'error');
        return;
      }

      if (!payload.legalName || !payload.signatureName || !payload.signedDate) {
        setMessage(webFormStatus, 'Legal name, signature name, and signed date are required.', 'error');
        return;
      }

      if (webFormSubmitBtn) webFormSubmitBtn.disabled = true;
      try {
        const res = await apiFetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMessage(webFormStatus, data.error || config.errorMessage, 'error');
          return;
        }

        setMessage(webFormStatus, config.successMessage, 'success');
        await loadEmployeeDashboard(currentUser);
        closeEmployeeWebFormModal();
      } finally {
        if (webFormSubmitBtn) webFormSubmitBtn.disabled = false;
      }
    });
  }

  if (checklistEl && checklistEl.dataset.bound !== '1') {
    checklistEl.dataset.bound = '1';
    checklistEl.addEventListener('click', (event) => {
      const viewBtn = event.target.closest('[data-checklist-view-url]');
      if (viewBtn) {
        const fileUrl = String(viewBtn.dataset.checklistViewUrl || '').trim();
        if (!fileUrl) return;
        window.open(fileUrl, '_blank', 'noopener');
        return;
      }

      const webFormBtn = event.target.closest('[data-employee-web-form]');
      if (webFormBtn) {
        openEmployeeWebForm(webFormBtn.dataset.employeeWebForm);
        return;
      }

      const sectionBtn = event.target.closest('[data-checklist-open-section]');
      if (sectionBtn) {
        const sectionId = String(sectionBtn.dataset.checklistOpenSection || '').trim();
        const targetSection = sectionId ? document.getElementById(sectionId) : null;
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const focusTarget = targetSection.querySelector('input, select, textarea, button');
          if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus({ preventScroll: true });
          }
        }
        return;
      }

      const uploadBtn = event.target.closest('[data-checklist-upload-type]');
      if (!uploadBtn) return;
      const documentType = String(uploadBtn.dataset.checklistUploadType || '').trim();
      if (!documentType) return;
      openEmployeeUploadForDocumentType(documentType);
    });
  }

  if (backgroundUploadBtn && backgroundUploadBtn.dataset.bound !== '1') {
    backgroundUploadBtn.dataset.bound = '1';
    backgroundUploadBtn.addEventListener('click', () => {
      openEmployeeUploadForDocumentType('background_clearance_form');
    });
  }

  if (trainingSection && trainingSection.dataset.bound !== '1') {
    trainingSection.dataset.bound = '1';
    trainingSection.addEventListener('click', (event) => {
      const uploadBtn = event.target.closest('[data-checklist-upload-type]');
      if (!uploadBtn) return;
      const documentType = String(uploadBtn.dataset.checklistUploadType || '').trim();
      if (!documentType) return;
      openEmployeeUploadForDocumentType(documentType);
    });
  }

  if (applicationsTbody) {
    applicationsTbody.addEventListener('click', async (event) => {
      const withdrawBtn = event.target.closest('[data-withdraw-application-id]');
      if (!withdrawBtn) return;

      const applicationId = asInt(withdrawBtn.dataset.withdrawApplicationId);
      const msg = document.getElementById('employeeApplicationMessage');
      hideMessage(msg);

      if (!Number.isInteger(applicationId) || applicationId < 1) {
        setMessage(msg, 'Invalid application selection.', 'error');
        return;
      }

      const confirmed = window.confirm('Withdraw this application? This will remove this application record.');
      if (!confirmed) return;

      const credential = resolveCredential('withdraw this application', msg);
      if (credential === null || credential === '') return;

      withdrawBtn.disabled = true;
      const prevText = withdrawBtn.textContent;
      withdrawBtn.textContent = 'Withdrawing...';

      try {
        const res = await apiFetch(`/api/portal/employee/applications/${applicationId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentCredential: credential }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMessage(msg, data.error || 'Failed to withdraw application.', 'error');
          return;
        }

        setMessage(msg, 'Application withdrawn successfully.', 'success');
        await loadEmployeeDashboard(currentUser);
      } finally {
        withdrawBtn.disabled = false;
        withdrawBtn.textContent = prevText;
      }
    });
  }

  if (openShiftsTbody && openShiftsTbody.dataset.bound !== '1') {
    openShiftsTbody.dataset.bound = '1';
    openShiftsTbody.addEventListener('click', async (event) => {
      const acceptBtn = event.target.closest('[data-accept-shift-id]');
      const declineBtn = event.target.closest('[data-decline-shift-id]');
      if (acceptBtn) {
        const shiftId = asInt(acceptBtn.dataset.acceptShiftId);
        if (Number.isInteger(shiftId) && shiftId > 0) {
          await handleEmployeeShiftDecision(currentUser, shiftId, 'accept');
        }
        return;
      }

      if (declineBtn) {
        const shiftId = asInt(declineBtn.dataset.declineShiftId);
        if (Number.isInteger(shiftId) && shiftId > 0) {
          await handleEmployeeShiftDecision(currentUser, shiftId, 'decline');
        }
      }
    });
  }

  if (currentAssignments && currentAssignments.dataset.bound !== '1') {
    currentAssignments.dataset.bound = '1';
    currentAssignments.addEventListener('click', async (event) => {
      const offerBtn = event.target.closest('[data-offer-assignment-id]');
      const withdrawBtn = event.target.closest('[data-withdraw-assignment-id]');

      if (offerBtn) {
        const assignmentId = asInt(offerBtn.dataset.offerAssignmentId);
        if (Number.isInteger(assignmentId) && assignmentId > 0) {
          await handleEmployeeShiftOffer(currentUser, assignmentId, offerBtn.dataset.shiftTitle || 'this shift');
        }
        return;
      }

      if (withdrawBtn) {
        const assignmentId = asInt(withdrawBtn.dataset.withdrawAssignmentId);
        if (Number.isInteger(assignmentId) && assignmentId > 0) {
          await handleEmployeeAssignmentWithdraw(
            currentUser,
            assignmentId,
            String(withdrawBtn.dataset.withdrawSchedule || ''),
            String(withdrawBtn.dataset.withdrawShiftTitle || 'this shift')
          );
        }
      }
    });
  }

  if (cancelSubmitBtn && cancelSubmitBtn.dataset.bound !== '1') {
    cancelSubmitBtn.dataset.bound = '1';
    cancelSubmitBtn.addEventListener('click', async () => {
      await submitEmployeeAssignmentWithdraw(currentUser);
    });
  }

  if (cancelCloseBtn && cancelCloseBtn.dataset.bound !== '1') {
    cancelCloseBtn.dataset.bound = '1';
    cancelCloseBtn.addEventListener('click', () => {
      if (cancelPanel) cancelPanel.style.display = 'none';
      if (cancelPanelMsg) hideMessage(cancelPanelMsg);
      if (cancelAssignmentId) cancelAssignmentId.value = '';
      if (cancelReasonInput) cancelReasonInput.value = '';
      if (cancelDoctorNoteInput) cancelDoctorNoteInput.value = '';
    });
  }

  if (offersTbody && offersTbody.dataset.bound !== '1') {
    offersTbody.dataset.bound = '1';
    offersTbody.addEventListener('click', async (event) => {
      const acceptBtn = event.target.closest('[data-accept-offer-id]');
      const declineBtn = event.target.closest('[data-decline-offer-id]');

      if (acceptBtn) {
        const offerId = asInt(acceptBtn.dataset.acceptOfferId);
        if (Number.isInteger(offerId) && offerId > 0) {
          await handleEmployeeOfferResponse(currentUser, offerId, 'accept');
        }
        return;
      }

      if (declineBtn) {
        const offerId = asInt(declineBtn.dataset.declineOfferId);
        if (Number.isInteger(offerId) && offerId > 0) {
          await handleEmployeeOfferResponse(currentUser, offerId, 'decline');
        }
      }
    });
  }

  if (clockInBtn && clockAssignmentSelect && clockInBtn.dataset.bound !== '1') {
    clockInBtn.dataset.bound = '1';
    clockInBtn.addEventListener('click', async () => {
      if (clockMsg) hideMessage(clockMsg);
      const assignmentId = asInt(clockAssignmentSelect.value);
      if (!Number.isInteger(assignmentId) || assignmentId < 1) {
        if (clockMsg) setMessage(clockMsg, 'Select an assigned shift before clocking in.', 'error');
        return;
      }

      let coordinates;
      try {
        coordinates = await getCurrentDeviceCoordinates();
      } catch (error) {
        if (clockMsg) setMessage(clockMsg, error.message || 'Location access is required to clock in.', 'error');
        return;
      }

      const res = await apiFetch('/api/portal/employee/timeclock/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (clockMsg) setMessage(clockMsg, payload.error || 'Failed to clock in.', 'error');
        return;
      }

      if (clockMsg) setMessage(clockMsg, 'Clock-in recorded.', 'success');
      await loadEmployeeTimeClock();
    });
  }

  if (clockOutBtn && clockAssignmentSelect && clockOutBtn.dataset.bound !== '1') {
    clockOutBtn.dataset.bound = '1';
    clockOutBtn.addEventListener('click', async () => {
      if (clockMsg) hideMessage(clockMsg);
      const assignmentId = asInt(clockAssignmentSelect.value);

      let coordinates;
      try {
        coordinates = await getCurrentDeviceCoordinates();
      } catch (error) {
        if (clockMsg) setMessage(clockMsg, error.message || 'Location access is required to clock out.', 'error');
        return;
      }

      const requestBody = Number.isInteger(assignmentId) && assignmentId > 0
        ? { assignmentId, latitude: coordinates.latitude, longitude: coordinates.longitude }
        : { latitude: coordinates.latitude, longitude: coordinates.longitude };

      const res = await apiFetch('/api/portal/employee/timeclock/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (clockMsg) setMessage(clockMsg, payload.error || 'Failed to clock out.', 'error');
        return;
      }

      if (clockMsg) setMessage(clockMsg, 'Clock-out recorded.', 'success');
      await loadEmployeeTimeClock();
    });
  }

  const documentForm = document.getElementById('employeeDocumentForm');
  if (documentForm) {
    const ssnVerificationInput = document.getElementById('employeeDocumentSsn');
    const ssnVerificationConfirm = document.getElementById('employeeDocumentSsnConfirm');

    if (ssnVerificationInput && ssnVerificationInput.dataset.bound !== '1') {
      ssnVerificationInput.dataset.bound = '1';
      ssnVerificationInput.addEventListener('input', () => {
        const digits = String(ssnVerificationInput.value || '').replace(/\D/g, '').slice(0, 9);
        if (digits.length <= 3) {
          ssnVerificationInput.value = digits;
        } else if (digits.length <= 5) {
          ssnVerificationInput.value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
        } else {
          ssnVerificationInput.value = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
        }
      });
    }

    documentForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('employeeDocumentMessage');
      hideMessage(msg);

      const fileInput = documentForm.document;
      const file = fileInput && fileInput.files ? fileInput.files[0] : null;
      if (!file) {
        setMessage(msg, 'Please choose a document to upload.', 'error');
        return;
      }

      const documentType = documentForm.documentType.value || 'resume';
      const expirationDate = documentForm.expirationDate.value;
      const ssnVerification = ssnVerificationInput ? String(ssnVerificationInput.value || '').trim() : '';
      const ssnVerificationDigits = ssnVerification.replace(/\D/g, '');

      if (documentType === 'social_security_or_work_authorization') {
        if (ssnVerificationDigits.length !== 9) {
          setMessage(msg, 'Enter a valid Social Security number for verification before uploading this document.', 'error');
          return;
        }

        if (!ssnVerificationConfirm || !ssnVerificationConfirm.checked) {
          setMessage(msg, 'You must confirm the Social Security number acknowledgment before uploading this document.', 'error');
          return;
        }
      }

      if (EXPIRATION_REQUIRED_TYPES.has(documentType) && !expirationDate) {
        setMessage(msg, 'This document type requires an expiration date.', 'error');
        return;
      }

      const applicationIdValue = documentForm.applicationId.value.trim();
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('document', file);
      if (expirationDate) formData.append('expirationDate', expirationDate);
      if (documentType === 'social_security_or_work_authorization') {
        formData.append('ssn', ssnVerification);
        formData.append('ssnConfirm', ssnVerificationConfirm && ssnVerificationConfirm.checked ? 'true' : 'false');
      }
      if (applicationIdValue) {
        formData.append('applicationId', applicationIdValue);
      }

      const res = await apiFetch('/api/portal/employee/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(msg, data.error || 'Upload failed.', 'error');
        return;
      }

      setMessage(msg, 'Document uploaded successfully.', 'success');
      documentForm.reset();
      syncEmployeeSsnVerificationFields(documentForm.documentType.value);
      await loadEmployeeDashboard(currentUser);
    });
  }

  const w4Form = document.getElementById('employeeW4Form');
  const w9Form = document.getElementById('employeeW9Form');
  if (w4Form) {
    if (!w4Form.signedDate.value) {
      w4Form.signedDate.value = getTodayIsoDate();
    }
    syncEmployeeTaxFormSnapshot(w4Form, 'w4');

    w4Form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('employeeW4Message');
      hideMessage(msg);

      const payload = buildEmployeeW4Payload(w4Form);

      if (!payload.legalName || !payload.signatureName || !payload.signedDate) {
        setMessage(msg, 'Legal name, signature name, and signed date are required.', 'error');
        return;
      }

      const res = await apiFetch('/api/portal/employee/w4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(msg, data.error || 'Failed to save W-4 information.', 'error');
        return;
      }

      setMessage(msg, 'W-4 information saved successfully.', 'success');
      await loadEmployeeDashboard(currentUser);
    });

    const clearW4Btn = document.getElementById('employeeW4ClearBtn');
    if (clearW4Btn) {
      clearW4Btn.addEventListener('click', async () => {
        const msg = document.getElementById('employeeW4Message');
        hideMessage(msg);
        const confirmed = window.confirm('Clear your saved W-4 form and reset this form?');
        if (!confirmed) return;

        const res = await apiFetch('/api/portal/employee/w4', { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMessage(msg, data.error || 'Failed to clear W-4 information.', 'error');
          return;
        }

        setMessage(msg, 'W-4 information cleared.', 'success');
        await loadEmployeeDashboard(currentUser);
      });
    }
  }

  // Tax Forms tab switching
  const taxTabW4Btn = document.getElementById('taxTabW4Btn');
  const taxTabW9Btn = document.getElementById('taxTabW9Btn');
  const taxFormW4Panel = document.getElementById('taxFormW4Panel');
  const taxFormW9Panel = document.getElementById('taxFormW9Panel');

  function getActiveTaxTab() {
    return taxFormW9Panel && !taxFormW9Panel.hidden ? 'w9' : 'w4';
  }

  function switchTaxTab(tab) {
    const currentTab = getActiveTaxTab();
    if (currentTab !== tab) {
      const currentForm = currentTab === 'w9' ? w9Form : w4Form;
      const currentMessage = document.getElementById(currentTab === 'w9' ? 'employeeW9Message' : 'employeeW4Message');
      if (currentForm && hasUnsavedEmployeeTaxFormChanges(currentForm, currentTab)) {
        const confirmed = window.confirm('You have unsaved tax form changes. Switch forms and discard those unsaved changes?');
        if (!confirmed) return;
        restoreEmployeeTaxFormSnapshot(currentForm, currentTab);
        if (currentMessage) hideMessage(currentMessage);
      }
    }

    const isW4 = tab === 'w4';
    if (taxTabW4Btn) {
      taxTabW4Btn.classList.toggle('portal-tax-tab--active', isW4);
      taxTabW4Btn.setAttribute('aria-selected', String(isW4));
    }
    if (taxTabW9Btn) {
      taxTabW9Btn.classList.toggle('portal-tax-tab--active', !isW4);
      taxTabW9Btn.setAttribute('aria-selected', String(!isW4));
    }
    if (taxFormW4Panel) taxFormW4Panel.hidden = !isW4;
    if (taxFormW9Panel) taxFormW9Panel.hidden = isW4;
  }

  if (taxTabW4Btn) taxTabW4Btn.addEventListener('click', () => switchTaxTab('w4'));
  if (taxTabW9Btn) taxTabW9Btn.addEventListener('click', () => switchTaxTab('w9'));

  // W-9 conditional fields (LLC type / Other description)
  const w9TaxClassification = document.getElementById('w9TaxClassification');
  if (w9TaxClassification) {
    w9TaxClassification.addEventListener('change', () => {
      syncW9ConditionalFields(document.getElementById('employeeW9Form'));
    });
  }

  // W-9 form submit
  if (w9Form) {
    if (!w9Form.signedDate.value) {
      w9Form.signedDate.value = getTodayIsoDate();
    }
    syncEmployeeTaxFormSnapshot(w9Form, 'w9');

    w9Form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('employeeW9Message');
      hideMessage(msg);

      const payload = buildEmployeeW9Payload(w9Form);
      const classification = payload.taxClassification;

      if (!payload.name || !payload.taxClassification || !payload.tin || !payload.signatureName || !payload.signedDate) {
        setMessage(msg, 'Name, tax classification, TIN, signature name, and signed date are required.', 'error');
        return;
      }

      if (classification === 'llc' && !payload.llcType) {
        setMessage(msg, 'Please select an LLC type (C, S, or P).', 'error');
        return;
      }

      const res = await apiFetch('/api/portal/employee/w9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(msg, data.error || 'Failed to save W-9 information.', 'error');
        return;
      }

      setMessage(msg, 'W-9 information saved successfully.', 'success');
      await loadEmployeeDashboard(currentUser);
    });

    const clearW9Btn = document.getElementById('employeeW9ClearBtn');
    if (clearW9Btn) {
      clearW9Btn.addEventListener('click', async () => {
        const msg = document.getElementById('employeeW9Message');
        hideMessage(msg);
        const confirmed = window.confirm('Clear your saved W-9 form and reset this form?');
        if (!confirmed) return;

        const res = await apiFetch('/api/portal/employee/w9', { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMessage(msg, data.error || 'Failed to clear W-9 information.', 'error');
          return;
        }

        setMessage(msg, 'W-9 information cleared.', 'success');
        await loadEmployeeDashboard(currentUser);
      });
    }
  }

  // SSN form
  const ssnForm = document.getElementById('employeeSsnForm');
  const ssnOnFileDisplay = document.getElementById('employeeSsnOnFileDisplay');
  const ssnMaskedEl = document.getElementById('employeeSsnMasked');
  const ssnViewBtn = document.getElementById('employeeSsnViewBtn');
  const ssnHideBtn = document.getElementById('employeeSsnHideBtn');
  const ssnInput = document.getElementById('employeeSsnInput');

  if (ssnViewBtn && ssnMaskedEl && ssnHideBtn) {
    ssnViewBtn.addEventListener('click', async () => {
      const res = await apiFetch('/api/portal/employee/ssn');
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.ssn) {
        ssnMaskedEl.textContent = 'Unable to retrieve SSN.';
        return;
      }
      ssnMaskedEl.textContent = payload.ssn;
      ssnViewBtn.style.display = 'none';
      ssnHideBtn.style.display = 'inline-flex';
    });

    ssnHideBtn.addEventListener('click', () => {
      ssnMaskedEl.textContent = '\u25CF\u25CF\u25CF-\u25CF\u25CF-\u25CF\u25CF\u25CF\u25CF';
      ssnViewBtn.style.display = 'inline-flex';
      ssnHideBtn.style.display = 'none';
    });
  }

  if (ssnForm) {
    // SSN input auto-format: insert dashes as user types
    if (ssnInput) {
      ssnInput.addEventListener('input', () => {
        const digits = String(ssnInput.value || '').replace(/\D/g, '').slice(0, 9);
        if (digits.length <= 3) {
          ssnInput.value = digits;
        } else if (digits.length <= 5) {
          ssnInput.value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
        } else {
          ssnInput.value = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
        }
      });
    }

    ssnForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('employeeSsnMessage');
      hideMessage(msg);
      const saveBtn = document.getElementById('employeeSsnSaveBtn');
      if (saveBtn) saveBtn.disabled = true;

      const ssn = ssnInput ? String(ssnInput.value || '').trim() : '';
      const digits = ssn.replace(/\D/g, '');
      if (digits.length !== 9) {
        setMessage(msg, 'SSN must be exactly 9 digits.', 'error');
        if (saveBtn) saveBtn.disabled = false;
        return;
      }

      try {
        const res = await apiFetch('/api/portal/employee/ssn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ssn }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(msg, payload.error || 'Failed to save SSN.', 'error');
          return;
        }
        setMessage(msg, `SSN saved successfully. Last 4: ${escapeHtml(payload.last4 || '')}`, 'success');
        if (ssnForm) ssnForm.reset();
        // Show the on-file block
        if (ssnOnFileDisplay) ssnOnFileDisplay.style.display = 'block';
        if (ssnMaskedEl) ssnMaskedEl.textContent = '\u25CF\u25CF\u25CF-\u25CF\u25CF-\u25CF\u25CF\u25CF\u25CF';
        if (ssnViewBtn) ssnViewBtn.style.display = 'inline-flex';
        if (ssnHideBtn) ssnHideBtn.style.display = 'none';
        await loadEmployeeDashboard(currentUser);
      } finally {
        if (saveBtn) saveBtn.disabled = false;
      }
    });
  }

  // ── Weekly Timesheet Form ──────────────────────────────────────────────────
  const weeklyTsForm = document.getElementById('employeeWeeklyTimesheetForm');
  const weeklyPeriodStartEl = document.getElementById('employeeWeeklyPeriodStart');
  const weeklyPeriodEndEl = document.getElementById('employeeWeeklyPeriodEnd');
  const weeklyAssignmentEl = document.getElementById('employeeWeeklyAssignment');

  if (weeklyPeriodStartEl && weeklyPeriodStartEl.dataset.bound !== '1') {
    weeklyPeriodStartEl.dataset.bound = '1';
    weeklyPeriodStartEl.addEventListener('change', () => {
      const val = weeklyPeriodStartEl.value;
      if (!val) return;

      // Snap to nearest Monday
      const d = new Date(val + 'T00:00:00');
      const dow = d.getDay(); // 0=Sun, 1=Mon, ...
      if (dow !== 1) {
        const diff = dow === 0 ? -6 : 1 - dow;
        d.setDate(d.getDate() + diff);
        weeklyPeriodStartEl.value = d.toISOString().slice(0, 10);
      }

      // Auto-fill Sunday as period end
      const end = new Date(d);
      end.setDate(d.getDate() + 6);
      if (weeklyPeriodEndEl) weeklyPeriodEndEl.value = end.toISOString().slice(0, 10);

      buildWeeklyTimesheetRows(weeklyPeriodStartEl.value);
      autoPopulateWeeklyRowsFromClockEntries();
    });
  }

  if (weeklyAssignmentEl && weeklyAssignmentEl.dataset.bound !== '1') {
    weeklyAssignmentEl.dataset.bound = '1';
    weeklyAssignmentEl.addEventListener('change', () => {
      autoPopulateWeeklyRowsFromClockEntries();
    });
  }

  if (weeklyPeriodStartEl) {
    buildWeeklyTimesheetRows(weeklyPeriodStartEl.value || '');
    autoPopulateWeeklyRowsFromClockEntries();
  }

  if (weeklyTsForm && weeklyTsForm.dataset.bound !== '1') {
    weeklyTsForm.dataset.bound = '1';
    weeklyTsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('employeeWeeklyTimesheetMessage');
      const submitBtn = document.getElementById('employeeWeeklyTimesheetSubmitBtn');
      if (msg) hideMessage(msg);

      const assignmentId = (document.getElementById('employeeWeeklyAssignment') || {}).value || '';
      const periodStart = weeklyPeriodStartEl ? weeklyPeriodStartEl.value : '';
      const periodEnd = weeklyPeriodEndEl ? weeklyPeriodEndEl.value : '';
      const notes = (document.getElementById('employeeWeeklyNotes') || {}).value || '';
      const fileInput = document.getElementById('employeeWeeklyFile');
      const file = fileInput && fileInput.files ? fileInput.files[0] : null;

      if (!assignmentId) {
        if (msg) setMessage(msg, 'Please select an assignment.', 'error');
        return;
      }
      if (!periodStart || !periodEnd) {
        if (msg) setMessage(msg, 'Please select a period start date.', 'error');
        return;
      }
      if (!file) {
        if (msg) setMessage(msg, 'Please upload the completed paper timesheet before submitting manual time.', 'error');
        return;
      }

      // Collect non-skipped day entries (supports multiple entry rows per day)
      const tbody = document.getElementById('employeeWeeklyTsDaysTbody');
      const entries = [];

      const rows = tbody ? Array.from(tbody.querySelectorAll('tr.ts-entry-row')) : [];
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex];
        const dayIndex = Number(row.dataset.dayIndex || -1);

        const date = String(row.dataset.date || '').trim();
        const clockEntryId = Number(row.dataset.clockEntryId || 0);
        const startEl = row.querySelector('.ts-day-start');
        const endEl = row.querySelector('.ts-day-end');
        const noBreakCb = row.querySelector('.ts-no-break');
        const noBreakReasonEl = row.querySelector('.ts-no-break-reason');
        const noBreak = Boolean(noBreakCb && noBreakCb.checked);
        const noBreakReason = String((noBreakReasonEl && noBreakReasonEl.value) || '').trim();
        const lunchRadio = row.querySelector('input[data-lunch-choice="1"]:checked');
        const startVal = startEl ? String(startEl.value || '').trim() : '';
        const endVal = endEl ? String(endEl.value || '').trim() : '';
        const start24 = parseUsTimeTo24(startVal);
        const end24 = parseUsTimeTo24(endVal);

        // Prevent half-complete rows from silently being skipped.
        if ((startVal && !endVal) || (!startVal && endVal)) {
          if (msg) setMessage(msg, `Row ${rowIndex + 1} has an incomplete entry. Please fill both start and end time or clear both.`, 'error');
          return;
        }
        if (!startVal && !endVal) continue;
        if (!start24 || !end24) {
          if (msg) setMessage(msg, `Row ${rowIndex + 1} time format is invalid. Use h:mm AM/PM.`, 'error');
          return;
        }
        if (!date) {
          if (msg) setMessage(msg, `Row ${rowIndex + 1} needs a date. Click "Select date" for that row.`, 'error');
          return;
        }
        if (noBreak && !noBreakReason) {
          if (msg) setMessage(msg, `Row ${rowIndex + 1} marked "No break" requires a reason.`, 'error');
          return;
        }

        entries.push({
          date,
          startTime: start24,
          endTime: end24,
          lunchMinutes: noBreak ? 0 : (lunchRadio ? Number(lunchRadio.value) : 30),
          breakReason: noBreak ? noBreakReason : '',
          clockEntryId: Number.isInteger(clockEntryId) && clockEntryId > 0 ? clockEntryId : null,
        });
      }

      if (entries.length === 0) {
        if (msg) setMessage(msg, 'Please enter start and end times for at least one day.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('periodStart', periodStart);
      formData.append('periodEnd', periodEnd);
      formData.append('entries', JSON.stringify(entries));
      formData.append('notes', notes);
      if (file) formData.append('timesheetFile', file);

      if (submitBtn) submitBtn.disabled = true;
      const prevText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) submitBtn.textContent = 'Submitting…';

      try {
        const res = await apiFetch('/api/portal/employee/timesheets/upload', {
          method: 'POST',
          body: formData,
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (msg) setMessage(msg, payload.error || 'Failed to submit timesheet.', 'error');
          return;
        }
        if (msg) setMessage(msg, 'Weekly timesheet submitted for approval!', 'success');
        weeklyTsForm.reset();
        if (weeklyPeriodEndEl) weeklyPeriodEndEl.value = '';
        buildWeeklyTimesheetRows('');
        await loadEmployeeTimesheets();
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitBtn) submitBtn.textContent = prevText;
      }
    });
  }

  // ── NCNS Documentation Panel ──────────────────────────────────────────────
  const ncnsDocPanel = document.getElementById('employeeNcnsDocPanel');
  const ncnsDocType = document.getElementById('employeeNcnsDocType');
  const ncnsReasonRow = document.getElementById('employeeNcnsReasonRow');
  const ncnsMedicalRow = document.getElementById('employeeNcnsMedicalRow');
  const ncnsDocSubmitBtn = document.getElementById('employeeNcnsDocSubmitBtn');
  const ncnsDocCloseBtn = document.getElementById('employeeNcnsDocCloseBtn');
  const ncnsAssignmentsList = document.getElementById('employeeNcnsAssignmentsList');
  const ncnsAssignmentId = document.getElementById('employeeNcnsAssignmentId');
  const ncnsShiftInfo = document.getElementById('employeeNcnsDocShiftInfo');
  const ncnsDocMsg = document.getElementById('employeeNcnsDocMessage');

  function syncNcnsDocTypeRows(type) {
    const isMedical = type === 'medical';
    if (ncnsReasonRow) ncnsReasonRow.style.display = isMedical ? 'none' : '';
    if (ncnsMedicalRow) ncnsMedicalRow.style.display = isMedical ? '' : 'none';
  }

  if (ncnsDocType && ncnsDocType.dataset.bound !== '1') {
    ncnsDocType.dataset.bound = '1';
    ncnsDocType.addEventListener('change', () => syncNcnsDocTypeRows(ncnsDocType.value));
  }

  if (ncnsAssignmentsList && ncnsAssignmentsList.dataset.bound !== '1') {
    ncnsAssignmentsList.dataset.bound = '1';
    ncnsAssignmentsList.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-ncns-assignment-id]');
      if (!btn) return;
      const id = btn.dataset.ncnsAssignmentId;
      const title = btn.dataset.ncnsShiftTitle || 'Shift';
      const company = btn.dataset.ncnsCompany || '';
      if (ncnsAssignmentId) ncnsAssignmentId.value = id;
      if (ncnsShiftInfo) ncnsShiftInfo.textContent = `${title}${company ? ' \u2014 ' + company : ''}`;
      if (ncnsDocType) { ncnsDocType.value = 'non_medical'; syncNcnsDocTypeRows('non_medical'); }
      const ackCb = document.getElementById('employeeNcnsAcknowledge');
      if (ackCb) ackCb.checked = false;
      const reasonTa = document.getElementById('employeeNcnsReason');
      if (reasonTa) reasonTa.value = '';
      const noteInput = document.getElementById('employeeNcnsDoctorNote');
      if (noteInput) noteInput.value = '';
      if (ncnsDocMsg) hideMessage(ncnsDocMsg);
      if (ncnsDocPanel) ncnsDocPanel.style.display = '';
    });
  }

  if (ncnsDocSubmitBtn && ncnsDocSubmitBtn.dataset.bound !== '1') {
    ncnsDocSubmitBtn.dataset.bound = '1';
    ncnsDocSubmitBtn.addEventListener('click', async () => {
      if (ncnsDocMsg) hideMessage(ncnsDocMsg);
      const id = ncnsAssignmentId ? String(ncnsAssignmentId.value || '').trim() : '';
      if (!id) {
        if (ncnsDocMsg) setMessage(ncnsDocMsg, 'Assignment not identified.', 'error');
        return;
      }
      const type = ncnsDocType ? ncnsDocType.value : 'non_medical';
      const reasonEl = document.getElementById('employeeNcnsReason');
      const noteInput = document.getElementById('employeeNcnsDoctorNote');
      const ackCb = document.getElementById('employeeNcnsAcknowledge');
      if (type === 'non_medical') {
        const reason = reasonEl ? reasonEl.value.trim() : '';
        if (!reason) {
          if (ncnsDocMsg) setMessage(ncnsDocMsg, 'Please provide a reason for your absence.', 'error');
          return;
        }
      } else {
        if (!noteInput || !noteInput.files || !noteInput.files[0]) {
          if (ncnsDocMsg) setMessage(ncnsDocMsg, "Please upload your doctor's note.", 'error');
          return;
        }
        if (!ackCb || !ackCb.checked) {
          if (ncnsDocMsg) setMessage(ncnsDocMsg, "You must acknowledge the doctor's note attestation before submitting.", 'error');
          return;
        }
      }

      ncnsDocSubmitBtn.disabled = true;
      const prevText = ncnsDocSubmitBtn.textContent;
      ncnsDocSubmitBtn.textContent = 'Submitting\u2026';
      try {
        const formData = new FormData();
        formData.append('cancellationType', type);
        if (type === 'non_medical') {
          formData.append('reason', reasonEl ? reasonEl.value.trim() : '');
        } else {
          formData.append('doctorNote', noteInput.files[0]);
          formData.append('doctorNoteAcknowledged', 'true');
        }
        const res = await apiFetch(`/api/shifts/assignments/${encodeURIComponent(id)}/ncns-excuse`, {
          method: 'POST',
          body: formData,
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (ncnsDocMsg) setMessage(ncnsDocMsg, payload.error || 'Failed to submit documentation.', 'error');
          return;
        }
        if (ncnsDocMsg) setMessage(ncnsDocMsg, 'Documentation submitted successfully.', 'success');
        setTimeout(() => {
          if (ncnsDocPanel) ncnsDocPanel.style.display = 'none';
          apiFetch('/api/portal/employee/ncns-assignments').then(r => r.json()).then(p => {
            renderEmployeeNcnsAssignments(Array.isArray(p.data) ? p.data : []);
          }).catch(() => {});
        }, 1500);
      } finally {
        ncnsDocSubmitBtn.disabled = false;
        ncnsDocSubmitBtn.textContent = prevText;
      }
    });
  }

  if (ncnsDocCloseBtn && ncnsDocCloseBtn.dataset.bound !== '1') {
    ncnsDocCloseBtn.dataset.bound = '1';
    ncnsDocCloseBtn.addEventListener('click', () => {
      if (ncnsDocPanel) ncnsDocPanel.style.display = 'none';
      if (ncnsAssignmentId) ncnsAssignmentId.value = '';
      if (ncnsShiftInfo) ncnsShiftInfo.textContent = '';
      if (ncnsDocType) { ncnsDocType.value = 'non_medical'; syncNcnsDocTypeRows('non_medical'); }
      const ackCb = document.getElementById('employeeNcnsAcknowledge');
      if (ackCb) ackCb.checked = false;
      const reasonTa = document.getElementById('employeeNcnsReason');
      if (reasonTa) reasonTa.value = '';
      const noteInput = document.getElementById('employeeNcnsDoctorNote');
      if (noteInput) noteInput.value = '';
      if (ncnsDocMsg) hideMessage(ncnsDocMsg);
    });
  }
}

async function loadJobsiteDashboard(user) {
  const res = await apiFetch('/api/portal/jobsite/dashboard');
  if (!res.ok) {
    redirectToUserHome(user, 'loadJobsiteDashboard', { status: res.status });
    return;
  }
  const data = await res.json();
  renderJobsiteDashboard(data);
  await Promise.all([
    loadJobsiteOpenShifts(),
    loadJobsiteTimesheets(),
    loadJobsiteContracts(),
  ]);
  const miscDocs = await loadJobsiteMiscDocs();
  renderJobsiteMiscDocs(miscDocs);
}

async function loadAdminDashboard(user) {
  clearAdminDashboardLoadMessages();

  const adminRequests = [
    { key: 'dashboard', url: '/api/portal/admin/dashboard', fallback: buildAdminDashboardFallback(user) },
    { key: 'users', url: '/api/admin/users', fallback: { data: [] } },
    { key: 'jobs', url: '/api/admin/jobs', fallback: { data: [] } },
    { key: 'employees', url: '/api/admin/employees', fallback: { data: [] } },
    { key: 'documents', url: '/api/admin/documents', fallback: { data: [] } },
    { key: 'assignments', url: '/api/admin/assignments', fallback: { data: [] } },
    { key: 'timesheets', url: '/api/admin/timesheets', fallback: { timesheets: [] } },
    { key: 'excuseForms', url: '/api/admin/excuse-forms', fallback: { data: [] } },
  ];

  const settled = await Promise.allSettled(adminRequests.map((request) => apiFetch(request.url)));
  const payloads = {};
  const failures = {};

  for (let index = 0; index < adminRequests.length; index += 1) {
    const request = adminRequests[index];
    const result = settled[index];

    if (result.status !== 'fulfilled') {
      const message = result.reason && result.reason.message ? result.reason.message : 'Network request failed.';
      failures[request.key] = { message };
      payloads[request.key] = request.fallback;
      console.warn('[admin-dashboard] request rejected', { key: request.key, url: request.url, message });
      continue;
    }

    const response = result.value;
    const parsed = await response.json().catch((error) => {
      const message = error && error.message ? error.message : 'Invalid server response.';
      failures[request.key] = { message };
      console.warn('[admin-dashboard] response parse failed', { key: request.key, url: request.url, status: response.status, message });
      return request.fallback;
    });

    if (!response.ok) {
      const message = parsed && parsed.error
        ? parsed.error
        : `Request failed with status ${response.status}.`;
      failures[request.key] = { message, status: response.status };
      payloads[request.key] = request.fallback;
      console.warn('[admin-dashboard] request failed', { key: request.key, url: request.url, status: response.status, message });
      continue;
    }

    payloads[request.key] = parsed;
  }

  renderAdminDashboard(
    payloads.dashboard || buildAdminDashboardFallback(user),
    payloads.users || { data: [] },
    payloads.jobs || { data: [] },
    payloads.employees || { data: [] },
    payloads.documents || { data: [] },
    payloads.assignments || { data: [] },
    payloads.timesheets || { timesheets: [] },
    payloads.excuseForms || { data: [] }
  );

  applyAdminDashboardFailureState(failures);
}

let onboardingPortalSelectedEmployeeId = null;

function formatPortalClientName(item) {
  return item.clientCompanyName || item.companyName || item.clientContactName || item.contactName || item.clientUserName || item.name || 'Client';
}

function formatReminderTypeLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'paper_timesheet_monday_8am') return 'Monday 8:00 AM final reminder';
  return 'Sunday 12:00 PM reminder';
}

function getTimesheetPayPeriods(timesheets = []) {
  const unique = new Map();
  for (const ts of timesheets) {
    const start = String(ts && ts.periodStart ? ts.periodStart : '').slice(0, 10);
    const end = String(ts && ts.periodEnd ? ts.periodEnd : '').slice(0, 10);
    if (!start || !end) continue;
    const key = `${start}|${end}`;
    if (!unique.has(key)) {
      unique.set(key, { start, end });
    }
  }
  return Array.from(unique.values()).sort((a, b) => {
    if (a.start === b.start) return String(b.end).localeCompare(String(a.end));
    return String(b.start).localeCompare(String(a.start));
  });
}

function populateTimesheetExportPeriodOptions(selectId, timesheets = []) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = String(select.value || '').trim();
  const periods = getTimesheetPayPeriods(timesheets);
  select.innerHTML = '<option value="">All pay periods</option>' + periods.map((period) => (
    `<option value="${escapeHtml(`${period.start}|${period.end}`)}">${escapeHtml(formatDateRange(period.start, period.end))}</option>`
  )).join('');

  if (currentValue && Array.from(select.options).some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function parseExportPeriodSelection(selectId) {
  const raw = String(document.getElementById(selectId)?.value || '').trim();
  if (!raw || !raw.includes('|')) return { periodStart: '', periodEnd: '' };
  const [periodStart, periodEnd] = raw.split('|');
  return {
    periodStart: String(periodStart || '').trim(),
    periodEnd: String(periodEnd || '').trim(),
  };
}

function parseDownloadFilename(disposition, fallback) {
  const header = String(disposition || '');
  const match = header.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
  if (!match) return fallback;
  const raw = String(match[1] || '').trim().replace(/^\"|\"$/g, '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw || fallback;
  }
}

async function downloadTimesheetSummaryCsv(options = {}) {
  const {
    periodSelectId,
    messageId,
    employeeFilterId,
    statusFilterId,
    sourceFilterId,
  } = options;

  const msg = messageId ? document.getElementById(messageId) : null;
  if (msg) hideMessage(msg);

  const params = new URLSearchParams();
  const { periodStart, periodEnd } = parseExportPeriodSelection(periodSelectId);
  if (periodStart && periodEnd) {
    params.set('periodStart', periodStart);
    params.set('periodEnd', periodEnd);
  }

  const employeeUserId = asInt(document.getElementById(employeeFilterId || '')?.value || '');
  if (Number.isInteger(employeeUserId) && employeeUserId > 0) {
    params.set('employeeUserId', String(employeeUserId));
  }

  const status = String(document.getElementById(statusFilterId || '')?.value || '').trim().toLowerCase();
  if (status) params.set('status', status);

  const source = String(document.getElementById(sourceFilterId || '')?.value || '').trim().toLowerCase();
  if (source) params.set('source', source);

  const endpoint = `/api/admin/timesheets/export.csv${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await apiFetch(endpoint);

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    if (msg) setMessage(msg, payload.error || 'Unable to export timesheet summary right now.', 'error');
    return;
  }

  const blob = await res.blob();
  const fallbackName = periodStart && periodEnd
    ? `timesheet-summary-${periodStart}-to-${periodEnd}.csv`
    : 'timesheet-summary-all-periods.csv';
  const filename = parseDownloadFilename(res.headers.get('Content-Disposition'), fallbackName);

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);

  if (msg) setMessage(msg, 'Timesheet CSV downloaded.', 'success');
}

function renderSchedulingReminderDiagnostics(payload) {
  const summaryEl = document.getElementById('schedulingReminderDiagnosticsSummary');
  const employees = Array.isArray(payload && payload.employees) ? payload.employees : [];
  const rows = employees.map((employee) => {
    const workedDates = Array.isArray(employee.workedDates) && employee.workedDates.length
      ? employee.workedDates.map((date) => escapeHtml(formatDateOnly(date))).join('<br>')
      : '—';
    const logStatus = employee.reminderAlreadyLogged
      ? `<span class="badge badge--green">Logged</span><br><span class="admin-inline-note">${escapeHtml(formatDateTime(employee.reminderLoggedAt))}</span>`
      : '<span class="badge badge--gray">Pending</span>';
    const lockStatus = employee.mandatoryPushLock
      ? `<span class="badge badge--yellow">Required</span><br><span class="admin-inline-note">${escapeHtml(employee.mandatoryPushLockSource || 'timesheet')}</span>`
      : '<span class="badge badge--gray">Not Locked</span>';
    return `
      <tr>
        <td>${escapeHtml(employee.name || 'Employee')}<br><span class="admin-inline-note">${escapeHtml(employee.email || '—')}</span></td>
        <td>${workedDates}</td>
        <td>${logStatus}</td>
        <td>${lockStatus}</td>
      </tr>
    `;
  });
  setTableRows('schedulingReminderDiagnosticsTbody', rows, 4, 'No employees match the selected reminder window.');

  if (summaryEl) {
    const periodStart = payload && payload.periodStart ? formatDateOnly(payload.periodStart) : '—';
    const periodEnd = payload && payload.periodEnd ? formatDateOnly(payload.periodEnd) : '—';
    const typeLabel = formatReminderTypeLabel(payload && payload.reminderType);
    const eligibleCount = Number(payload && payload.eligibleCount ? payload.eligibleCount : 0);
    const pendingCount = Number(payload && payload.pendingCount ? payload.pendingCount : 0);
    summaryEl.textContent = `${typeLabel} | Week ${periodStart} - ${periodEnd} | Eligible: ${eligibleCount} | Pending logs: ${pendingCount}`;
  }
}

async function loadSchedulingReminderDiagnostics() {
  const msg = document.getElementById('schedulingReminderDiagnosticsMessage');
  const dateField = document.getElementById('schedulingReminderDate');
  const weekOffsetField = document.getElementById('schedulingReminderWeekOffset');
  const reminderTypeField = document.getElementById('schedulingReminderType');
  if (!msg || !dateField || !weekOffsetField || !reminderTypeField) return;

  hideMessage(msg);
  const params = new URLSearchParams();
  const dateValue = String(dateField.value || '').trim();
  const weekOffsetValue = String(weekOffsetField.value || '').trim();
  const reminderTypeValue = String(reminderTypeField.value || '').trim();
  if (dateValue) params.set('date', dateValue);
  if (weekOffsetValue) params.set('weekOffset', weekOffsetValue);
  if (reminderTypeValue) params.set('reminderType', reminderTypeValue);

  const query = params.toString();
  const res = await apiFetch(`/api/admin/diagnostics/timesheet-reminders${query ? `?${query}` : ''}`);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    setMessage(msg, payload.error || 'Unable to load reminder diagnostics right now.', 'error');
    setTableRows('schedulingReminderDiagnosticsTbody', [], 4, 'Unable to load diagnostics.');
    return;
  }

  renderSchedulingReminderDiagnostics(payload);
}

async function loadSchedulingPortalData(user) {
  const res = await apiFetch('/api/portal/scheduling/dashboard');
  if (!res.ok) {
    redirectToUserHome(user, 'loadSchedulingPortalData', { status: res.status });
    return;
  }

  const payload = await res.json().catch(() => ({}));
  
  // Update industry badge
  const industry = document.getElementById('portalIndustry');
  if (industry) {
    industry.textContent = 'Scheduling';
  }

  const clients = Array.isArray(payload.clients) ? payload.clients : [];
  const signedContracts = Array.isArray(payload.signedContracts) ? payload.signedContracts : [];
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const timesheets = Array.isArray(payload.timesheets) ? payload.timesheets : [];

  const clientsRows = clients.map((client) => `
    <tr>
      <td>${escapeHtml(client.id)}</td>
      <td>${escapeHtml(formatPortalClientName(client))}</td>
      <td>${escapeHtml(client.email || '—')}</td>
      <td>${escapeHtml(client.industryTrack || '—')}</td>
      <td>${escapeHtml(client.address || '—')}</td>
    </tr>
  `);
  setTableRows('schedulingClientsTbody', clientsRows, 5, 'No registered clients found.');

  const contractRows = signedContracts.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(formatPortalClientName(item))}</td>
      <td>${escapeHtml(item.originalName || 'Contract')}</td>
      <td>${statusBadge(item.status)}</td>
      <td>${escapeHtml(formatDateTime(item.executedAt || item.adminSignedAt || item.createdAt))}</td>
      <td><a class="button button--ghost button--sm" href="${escapeHtml(item.fileUrl || '#')}" target="_blank" rel="noopener">View</a></td>
    </tr>
  `);
  setTableRows('schedulingContractsTbody', contractRows, 6, 'No signed contracts available.');

  const jobRows = jobs.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(formatPortalClientName(item))}</td>
      <td>${escapeHtml(item.title || '—')}</td>
      <td>${escapeHtml(item.schedule || '—')}</td>
      <td>${statusBadge(item.status || 'open')}</td>
    </tr>
  `);
  setTableRows('schedulingJobsTbody', jobRows, 5, 'No scheduled shifts yet.');

  const timesheetRows = timesheets.map((ts) => {
    const sourceLabel = ts.source === 'paper' ? 'Paper Upload' : ts.source === 'manual' ? 'Manual Entry' : 'Clock';
    const sourceBadgeCls = ts.source === 'paper' ? 'badge--gray' : ts.source === 'manual' ? 'badge--yellow' : 'badge--green';
    return `
      <tr>
        <td>${escapeHtml(ts.employeeName || 'Employee')}</td>
        <td>${escapeHtml(formatDateRange(ts.periodStart, ts.periodEnd))}</td>
        <td>${escapeHtml(ts.jobTitle || '—')}</td>
        <td>${escapeHtml(ts.companyName || '—')}</td>
        <td>${escapeHtml(Number(ts.totalHours || 0).toFixed(2))}</td>
        <td><span class="badge ${sourceBadgeCls}">${escapeHtml(sourceLabel)}</span></td>
        <td>${statusBadge(ts.status || 'pending_approval')}</td>
        <td>${escapeHtml(ts.approvalSignature || '—')}</td>
      </tr>
    `;
  });
  setTableRows('schedulingTimesheetsTbody', timesheetRows, 8, 'No timesheet activity yet.');
  populateTimesheetExportPeriodOptions('schedulingTimesheetExportPeriod', timesheets);

  const clientSelect = document.getElementById('schedulingJobsiteUserId');
  if (clientSelect) {
    const current = clientSelect.value;
    clientSelect.innerHTML = '<option value="">Select client</option>' + clients
      .map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(`${formatPortalClientName(client)} (${client.industryTrack || 'track n/a'})`)}</option>`)
      .join('');
    if (current && clientSelect.querySelector(`option[value="${current}"]`)) clientSelect.value = current;
  }

  const dateField = document.getElementById('schedulingReminderDate');
  if (dateField && !dateField.value) dateField.value = toLocalDateYmd(new Date());
  await loadSchedulingReminderDiagnostics();
}

function bindSchedulingPortalForms(currentUser) {
  const form = document.getElementById('schedulingCreateJobForm');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const msg = document.getElementById('schedulingCreateJobMessage');
    hideMessage(msg);

    const payload = {
      jobsiteUserId: Number(form.jobsiteUserId.value),
      title: String(form.title.value || '').trim(),
      industry: String(form.industry.value || '').trim(),
      schedule: String(form.schedule.value || '').trim(),
      payRate: String(form.payRate.value || '').trim(),
    };

    if (!Number.isInteger(payload.jobsiteUserId) || payload.jobsiteUserId < 1 || !payload.title || !payload.industry || !payload.schedule) {
      setMessage(msg, 'Client, title, industry, and schedule are required.', 'error');
      return;
    }

    const res = await apiFetch('/api/portal/scheduling/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(msg, data.error || 'Unable to create shift.', 'error');
      return;
    }

    setMessage(msg, 'Shift scheduled successfully.', 'success');
    form.reset();
    await loadSchedulingPortalData(currentUser);
  });

  const schedulingTimesheetExportCsvBtn = document.getElementById('schedulingTimesheetExportCsvBtn');
  if (schedulingTimesheetExportCsvBtn && schedulingTimesheetExportCsvBtn.dataset.bound !== '1') {
    schedulingTimesheetExportCsvBtn.dataset.bound = '1';
    schedulingTimesheetExportCsvBtn.addEventListener('click', async () => {
      await downloadTimesheetSummaryCsv({
        periodSelectId: 'schedulingTimesheetExportPeriod',
        messageId: 'schedulingTimesheetExportMessage',
      });
    });
  }
}

function bindSchedulingReminderDiagnosticsForm() {
  const form = document.getElementById('schedulingReminderDiagnosticsForm');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loadSchedulingReminderDiagnostics();
  });
}

async function loadOnboardingEmployeeProfile(employeeId) {
  const profileWrap = document.getElementById('onboardingEmployeeProfile');
  const msg = document.getElementById('onboardingEmployeeDetailMessage');
  hideMessage(msg);

  const res = await apiFetch(`/api/portal/onboarding/employees/${employeeId}/profile`);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    setMessage(msg, payload.error || 'Unable to load employee detail.', 'error');
    return;
  }

  const payload = await res.json().catch(() => ({}));
  const employee = payload.employee || {};
  const docs = Array.isArray(payload.documents) ? payload.documents : [];

  if (profileWrap) {
    profileWrap.innerHTML = `
      ${renderEmployeeHeaderComponent(payload, { surface: true })}
      <p><strong>Name:</strong> ${escapeHtml(employee.name || '—')}</p>
      <p><strong>Email:</strong> ${escapeHtml(employee.email || '—')}</p>
      <p><strong>Phone:</strong> ${escapeHtml(formatPhoneForView(employee.phone))}</p>
      <p><strong>Background Status:</strong> ${backgroundStatusBadge(employee.backgroundStatus)}</p>
      <p><strong>Onboarding Status:</strong> ${escapeHtml(payload.onboardingStatus || 'registered')}</p>
    `;
  }

  const rows = docs.map((doc) => `
    <tr>
      <td>${escapeHtml(doc.documentType || 'document')}</td>
      <td>${escapeHtml(doc.originalName || 'File')}</td>
      <td>${escapeHtml(formatDateTime(doc.createdAt))}</td>
      <td>${statusBadge(doc.documentStatus || 'pending')}</td>
      <td>
        <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
          <a class="button button--ghost button--sm" href="${escapeHtml(doc.fileUrl || '#')}" target="_blank" rel="noopener">Open</a>
          <button class="button button--sm" type="button" data-onboarding-review-doc-id="${escapeHtml(doc.id)}" data-onboarding-review-action="approved">Approve</button>
          <button class="button button--danger button--sm" type="button" data-onboarding-review-doc-id="${escapeHtml(doc.id)}" data-onboarding-review-action="denied">Deny</button>
        </div>
      </td>
    </tr>
  `);
  setTableRows('onboardingEmployeeDocumentsTbody', rows, 5, 'No documents uploaded yet.');

  const employeeIdField = document.getElementById('onboardingSelectedEmployeeId');
  if (employeeIdField) employeeIdField.value = String(employeeId);
  const bgStatusField = document.getElementById('onboardingBackgroundStatus');
  if (bgStatusField) bgStatusField.value = String(employee.backgroundStatus || 'passed');
  adminState.selectedEmployeeId = Number(employeeId);
  adminState.selectedEmployeeDetail = payload;
  onboardingPortalSelectedEmployeeId = Number(employeeId);
}

async function loadOnboardingPortalData(user) {
  const res = await apiFetch('/api/portal/onboarding/employees');
  if (!res.ok) {
    redirectToUserHome(user, 'loadOnboardingPortalData', { status: res.status });
    return;
  }

  const payload = await res.json().catch(() => ({}));
  const employees = Array.isArray(payload.data) ? payload.data : [];

  adminState.employees = employees;
  adminState.currentAdminId = user && user.id ? Number(user.id) : null;
  renderAdminEmployeesTable();

  if (!employees.length) {
    hideAdminEmployeeDetail();
    return;
  }

  const selectedId = Number(adminState.selectedEmployeeId);
  const hasSelected = Number.isInteger(selectedId) && selectedId > 0 && employees.some((employee) => Number(employee.id) === selectedId);
  if (hasSelected) {
    await loadAdminEmployeeDetail(selectedId);
  }
}

function bindOnboardingPortalForms(currentUser) {
  const employeesTbody = document.getElementById('onboardingEmployeesTbody');
  if (employeesTbody && employeesTbody.dataset.bound !== '1') {
    employeesTbody.dataset.bound = '1';
    employeesTbody.addEventListener('click', async (event) => {
      const btn = event.target.closest('[data-onboarding-open-employee-id]');
      if (!btn) return;
      const employeeId = asInt(btn.dataset.onboardingOpenEmployeeId);
      if (!Number.isInteger(employeeId) || employeeId < 1) return;
      await loadOnboardingEmployeeProfile(employeeId);
    });
  }

  const docsTbody = document.getElementById('onboardingEmployeeDocumentsTbody');
  if (docsTbody && docsTbody.dataset.bound !== '1') {
    docsTbody.dataset.bound = '1';
    docsTbody.addEventListener('click', async (event) => {
      const btn = event.target.closest('[data-onboarding-review-doc-id]');
      if (!btn || !onboardingPortalSelectedEmployeeId) return;
      const docId = asInt(btn.dataset.onboardingReviewDocId);
      const action = String(btn.dataset.onboardingReviewAction || '').trim().toLowerCase();
      if (!Number.isInteger(docId) || docId < 1 || !['approved', 'denied'].includes(action)) return;

      const msg = document.getElementById('onboardingEmployeeDetailMessage');
      hideMessage(msg);
      const res = await apiFetch(`/api/portal/onboarding/employees/${onboardingPortalSelectedEmployeeId}/documents/${docId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(msg, payload.error || 'Unable to review document.', 'error');
        return;
      }
      setMessage(msg, `Document ${action}.`, 'success');
      await loadOnboardingPortalData(currentUser);
    });
  }

  const bgForm = document.getElementById('onboardingBackgroundStatusForm');
  if (bgForm && bgForm.dataset.bound !== '1') {
    bgForm.dataset.bound = '1';
    bgForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const employeeId = asInt(document.getElementById('onboardingSelectedEmployeeId')?.value);
      const status = String(document.getElementById('onboardingBackgroundStatus')?.value || '').trim();
      const msg = document.getElementById('onboardingBackgroundStatusMessage');
      hideMessage(msg);
      if (!Number.isInteger(employeeId) || employeeId < 1 || !status) {
        setMessage(msg, 'Select an employee and status first.', 'error');
        return;
      }
      const res = await apiFetch(`/api/portal/onboarding/employees/${employeeId}/background-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(msg, payload.error || 'Unable to save background status.', 'error');
        return;
      }
      setMessage(msg, 'Background status updated.', 'success');
      await loadOnboardingPortalData(currentUser);
    });
  }

  const uploadForm = document.getElementById('onboardingBackgroundUploadForm');
  if (uploadForm && uploadForm.dataset.bound !== '1') {
    uploadForm.dataset.bound = '1';
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const employeeId = asInt(document.getElementById('onboardingSelectedEmployeeId')?.value);
      const msg = document.getElementById('onboardingBackgroundUploadMessage');
      hideMessage(msg);
      if (!Number.isInteger(employeeId) || employeeId < 1) {
        setMessage(msg, 'Select an employee first.', 'error');
        return;
      }
      const formData = new FormData(uploadForm);
      const res = await apiFetch(`/api/portal/onboarding/employees/${employeeId}/background-document`, {
        method: 'POST',
        body: formData,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(msg, payload.error || 'Unable to upload background document.', 'error');
        return;
      }
      setMessage(msg, 'Background document uploaded.', 'success');
      uploadForm.reset();
      await loadOnboardingPortalData(currentUser);
    });
  }
}

async function loadContractsPortalData(user) {
  const res = await apiFetch('/api/portal/contracts/dashboard');
  if (!res.ok) {
    redirectToUserHome(user, 'loadContractsPortalData', { status: res.status });
    return;
  }

  const payload = await res.json().catch(() => ({}));
  const clients = Array.isArray(payload.clients) ? payload.clients : [];
  const contracts = Array.isArray(payload.contracts) ? payload.contracts : [];
  const bank = Array.isArray(payload.bank) ? payload.bank : [];

  const clientRows = clients.map((client) => {
    const status = Number(client.isActive) === 1
      ? '<span class="badge badge--green">Active</span>'
      : '<span class="badge badge--gray">Inactive</span>';
    return `
      <tr>
        <td>${escapeHtml(client.id)}</td>
        <td>${escapeHtml(client.companyName || client.name || 'Not set')}</td>
        <td>${escapeHtml(client.contactName || 'Not set')}</td>
        <td>${escapeHtml(client.email || '—')}</td>
        <td>${escapeHtml(formatIndustryTrackLabel(client.industryTrack || 'warehouse'))}</td>
        <td>${status}</td>
        <td>${escapeHtml(formatPhoneForView(client.phone, 'Not set'))}</td>
        <td>${escapeHtml(client.address || 'Not set')}</td>
      </tr>
    `;
  });
  setTableRows('contractsClientsTbody', clientRows, 8, 'No clients found.');

  // Reuse admin-style contract drawer selectors in contracts-scope portal.
  adminState.users = clients.map((client) => ({
    ...client,
    role: 'jobsite',
  }));

  const clientOptions = '<option value="">Select client</option>' + clients
    .map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(`${formatPortalClientName(client)} (${client.industryTrack || 'track n/a'})`)}</option>`)
    .join('');

  const clientSelect = document.getElementById('contractsJobsiteUserId');
  if (clientSelect) {
    const current = clientSelect.value;
    clientSelect.innerHTML = clientOptions;
    if (current && clientSelect.querySelector(`option[value="${current}"]`)) clientSelect.value = current;
  }

  const bankClientSelect = document.getElementById('contractsBankJobsiteUserId');
  if (bankClientSelect) {
    const current = bankClientSelect.value;
    bankClientSelect.innerHTML = clientOptions;
    if (current && bankClientSelect.querySelector(`option[value="${current}"]`)) bankClientSelect.value = current;
  }

  const contractRows = contracts.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(formatPortalClientName(item))}</td>
      <td>${escapeHtml(item.originalName || 'Contract')}</td>
      <td>${statusBadge(item.status)}</td>
      <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
      <td><a class="button button--ghost button--sm" href="${escapeHtml(item.fileUrl || '#')}" target="_blank" rel="noopener">Open</a></td>
    </tr>
  `);
  setTableRows('contractsAllTbody', contractRows, 6, 'No contracts found.');

  const bankRows = bank.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(item.originalName || 'Contract')}</td>
      <td>${escapeHtml(item.industryTrack || '—')}</td>
      <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
      <td>
        <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
          <a class="button button--ghost button--sm" href="${escapeHtml(item.fileUrl || '#')}" target="_blank" rel="noopener">Open</a>
          <button class="button button--sm" type="button" data-contracts-bank-send-id="${escapeHtml(item.id)}">Send</button>
        </div>
      </td>
    </tr>
  `);
  setTableRows('contractsBankTbody', bankRows, 5, 'No contract bank documents found.');

  // Populate admin-style contract tables used in the contracts portal HTML.
  const [allContracts, bankContracts, warehouseContracts, healthcareContracts] = await Promise.all([
    loadAdminContracts(),
    loadAdminContractsBank(),
    loadAdminContracts('warehouse'),
    loadAdminContracts('healthcare'),
  ]);
  adminState.contractsAll = allContracts;
  adminState.contractsBank = bankContracts;
  adminState.contractsWarehouse = warehouseContracts;
  adminState.contractsHealthcare = healthcareContracts;
  renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
  renderAdminContractsBankTable(adminState.contractsBank);
  renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse);
  renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
}

function bindContractsPortalForms(currentUser) {
  const uploadForm = document.getElementById('contractsSendForm');
  if (uploadForm && uploadForm.dataset.bound !== '1') {
    uploadForm.dataset.bound = '1';
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('contractsSendMessage');
      hideMessage(msg);

      const formData = new FormData(uploadForm);
      const res = await apiFetch('/api/portal/contracts/send', { method: 'POST', body: formData });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(msg, payload.error || 'Unable to send contract.', 'error');
        return;
      }
      setMessage(msg, 'Contract(s) sent to client.', 'success');
      uploadForm.reset();
      await loadContractsPortalData(currentUser);
    });
  }

  const bankForm = document.getElementById('contractsBankSendForm');
  if (bankForm && bankForm.dataset.bound !== '1') {
    bankForm.dataset.bound = '1';
    bankForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('contractsBankSendMessage');
      hideMessage(msg);
      const bankId = asInt(document.getElementById('contractsSelectedBankId')?.value);
      const jobsiteUserId = asInt(document.getElementById('contractsBankJobsiteUserId')?.value);
      if (!Number.isInteger(bankId) || bankId < 1 || !Number.isInteger(jobsiteUserId) || jobsiteUserId < 1) {
        setMessage(msg, 'Select a bank contract and client first.', 'error');
        return;
      }

      const res = await apiFetch(`/api/portal/contracts/send-bank/${bankId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobsiteUserId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(msg, payload.error || 'Unable to send bank contract.', 'error');
        return;
      }
      setMessage(msg, 'Bank contract sent to client.', 'success');
      await loadContractsPortalData(currentUser);
    });
  }

  const bankTbody = document.getElementById('contractsBankTbody');
  if (bankTbody && bankTbody.dataset.bound !== '1') {
    bankTbody.dataset.bound = '1';
    bankTbody.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-contracts-bank-send-id]');
      if (!btn) return;
      const bankId = asInt(btn.dataset.contractsBankSendId);
      if (!Number.isInteger(bankId) || bankId < 1) return;
      const input = document.getElementById('contractsSelectedBankId');
      if (input) input.value = String(bankId);
      const msg = document.getElementById('contractsBankSendMessage');
      setMessage(msg, `Selected bank contract #${bankId}. Choose a client and click Send.`, 'neutral');
    });
  }
}

function bindJobsiteForms(currentUser) {
  const createForm = document.getElementById('jobsiteCreateJobForm');
  const editForm = document.getElementById('jobsiteEditJobForm');
  const editSection = document.getElementById('jobsiteEditSection');
  const cancelBtn = document.getElementById('cancelEditJobBtn');
  const cancelFormBtn = document.getElementById('cancelEditJobBtnForm');
  const withdrawBtn = document.getElementById('jobsiteWithdrawBtn');
  
  // Profile edit
  const profileEditBtn = document.getElementById('jobsiteProfileEditBtn');
  const profileEditForm = document.getElementById('jobsiteProfileEditForm');
  const profileEditCancel = document.getElementById('jobsiteProfileEditCancel');
  const profileEditMsg = document.getElementById('jobsiteProfileEditMessage');
  const profileEditCompanyName = document.getElementById('jobsiteEditCompanyName');
  const profileEditContactName = document.getElementById('jobsiteEditContactName');
  const profileEditPhone = document.getElementById('jobsiteEditPhone');
  const profileEditAddress = document.getElementById('jobsiteEditAddress');
  const profileEditCity = document.getElementById('jobsiteEditCity');
  const profileEditState = document.getElementById('jobsiteEditState');
  const profileEditZip = document.getElementById('jobsiteEditZip');
  const profileDisplay = document.getElementById('jobsiteProfile');

  const parseAddressForEdit = (value) => {
    const text = String(value || '').trim();
    if (!text) return { address: '', city: '', state: '', zip: '' };

    const parts = text.split(',').map((part) => String(part || '').trim()).filter(Boolean);
    if (parts.length >= 4) {
      const zip = parts.pop() || '';
      const state = parts.pop() || '';
      const city = parts.pop() || '';
      const address = parts.join(', ');
      return { address, city, state, zip };
    }

    return { address: text, city: '', state: '', zip: '' };
  };

  if (profileEditBtn && profileEditForm) {
    profileEditBtn.addEventListener('click', () => {
      // Load current values
      const companyNameEl = profileDisplay.querySelector('span');
      if (companyNameEl) {
        const items = profileDisplay.querySelectorAll('.profile-info__item');
        if (items[0]) profileEditCompanyName.value = items[0].querySelector('span:last-child')?.textContent?.replace('Not set', '') || '';
        if (items[1]) profileEditContactName.value = items[1].querySelector('span:last-child')?.textContent?.replace('Not set', '') || '';
        if (items[3]) profileEditPhone.value = items[3].querySelector('span:last-child')?.textContent?.replace('Not set', '') || '';
        if (items[4]) {
          const rawAddress = items[4].querySelector('span:last-child')?.textContent?.replace('Not set', '') || '';
          const parsedAddress = parseAddressForEdit(rawAddress);
          profileEditAddress.value = parsedAddress.address;
          if (profileEditCity) profileEditCity.value = parsedAddress.city;
          if (profileEditState) profileEditState.value = parsedAddress.state;
          if (profileEditZip) profileEditZip.value = parsedAddress.zip;
        }
      }
      profileDisplay.hidden = true;
      profileEditForm.hidden = false;
      hideMessage(profileEditMsg);
    });
  }

  if (profileEditCancel) {
    profileEditCancel.addEventListener('click', () => {
      profileEditForm.hidden = true;
      profileDisplay.hidden = false;
      profileEditForm.reset();
      hideMessage(profileEditMsg);
    });
  }

  if (profileEditForm) {
    profileEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideMessage(profileEditMsg);

      const payload = {
        companyName: String(profileEditCompanyName.value || '').trim(),
        contactName: String(profileEditContactName.value || '').trim(),
        phone: String(profileEditPhone.value || '').trim(),
        address: String(profileEditAddress.value || '').trim(),
        city: String(profileEditCity?.value || '').trim(),
        state: String(profileEditState?.value || '').trim().toUpperCase(),
        zip: String(profileEditZip?.value || '').trim(),
      };

      if (!payload.companyName) {
        setMessage(profileEditMsg, 'Company name is required and cannot be empty.', 'error');
        return;
      }

      if (!payload.contactName) {
        setMessage(profileEditMsg, 'Primary contact name is required and cannot be empty.', 'error');
        return;
      }

      const hasAddressData = Boolean(payload.address || payload.city || payload.state || payload.zip);
      if (hasAddressData && (!payload.address || !payload.city || !payload.state || !payload.zip)) {
        setMessage(profileEditMsg, 'Enter street address, city, state, and ZIP code.', 'error');
        return;
      }

      if (payload.state && !/^[A-Z]{2}$/.test(payload.state)) {
        setMessage(profileEditMsg, 'State must be a 2-letter code (for example, NV).', 'error');
        return;
      }

      const res = await apiFetch('/api/portal/jobsite/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(profileEditMsg, data.error || 'Failed to update profile.', 'error');
        return;
      }

      setMessage(profileEditMsg, 'Profile updated successfully.', 'success');
      profileEditForm.hidden = true;
      profileDisplay.hidden = false;
      await loadJobsiteDashboard(currentUser);
    });
  }

  const schedulePickerSection = document.getElementById('jobsiteSchedulePickerSection');
  const schedulePickerBtn = document.getElementById('jobSchedulePickerBtn');
  const scheduleDateInput = document.getElementById('jobScheduleDate');
  const scheduleStartInput = document.getElementById('jobScheduleStart');
  const scheduleEndInput = document.getElementById('jobScheduleEnd');
  const scheduleApplyBtn = document.getElementById('jobScheduleApplyBtn');
  const scheduleCancelBtn = document.getElementById('jobScheduleCancelBtn');
  const schedulePickerMsg = document.getElementById('jobSchedulePickerMessage');
  const createStatPaySignatureRow = document.getElementById('jobStatPaySignatureRow');
  const createStatPaySignatureInput = document.getElementById('jobStatPaySignature');
  const editStatPaySignatureRow = document.getElementById('editJobStatPaySignatureRow');
  const editStatPaySignatureInput = document.getElementById('editJobStatPaySignature');
  let currentSchedule = '';

  const syncStatPaySignatureUi = () => {
    const createChecked = Boolean(createForm && createForm.statPayEnabled && createForm.statPayEnabled.checked);
    if (createStatPaySignatureRow) createStatPaySignatureRow.style.display = createChecked ? '' : 'none';
    if (!createChecked && createStatPaySignatureInput) createStatPaySignatureInput.value = '';

    const editChecked = Boolean(editForm && editForm.statPayEnabled && editForm.statPayEnabled.checked);
    if (editStatPaySignatureRow) editStatPaySignatureRow.style.display = editChecked ? '' : 'none';
    if (!editChecked && editStatPaySignatureInput) editStatPaySignatureInput.value = '';
  };

  const buildScheduleText = (dateValue, startValue, endValue) => {
    const date = new Date(`${dateValue}T00:00:00`);
    const validDate = Number.isFinite(date.getTime());
    if (!validDate) return '';

    const formatTime = (value) => {
      const normalized = parseUsTimeTo24(value);
      if (!normalized) return '';
      const [hoursText, minutesText] = normalized.split(':');
      const hours = Number(hoursText);
      const minutes = Number(minutesText);
      if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '';
      const hour12 = ((hours + 11) % 12) + 1;
      const period = hours >= 12 ? 'PM' : 'AM';
      return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    const startText = formatTime(startValue);
    const endText = formatTime(endValue);
    if (!startText || !endText) return '';

    const prettyDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${prettyDate} ${startText} until ${endText}`;
  };

  const updateSchedulePreview = () => {
    const previewEl = document.getElementById('jobSchedulePreview');
    if (!previewEl) return;

    const dateValue = String(scheduleDateInput?.value || '').trim();
    const startValue = String(scheduleStartInput?.value || '').trim();
    const endValue = String(scheduleEndInput?.value || '').trim();

    if (!dateValue || !startValue || !endValue) {
      previewEl.textContent = '—';
      return;
    }

    const scheduleText = buildScheduleText(dateValue, startValue, endValue);
    previewEl.textContent = scheduleText || '—';
  };

  if (scheduleDateInput) scheduleDateInput.addEventListener('change', updateSchedulePreview);
  if (scheduleStartInput) {
    scheduleStartInput.addEventListener('change', () => {
      normalizeTimeInputDisplay(scheduleStartInput);
      updateSchedulePreview();
    });
    scheduleStartInput.addEventListener('blur', () => {
      normalizeTimeInputDisplay(scheduleStartInput);
      updateSchedulePreview();
    });
  }
  if (scheduleEndInput) {
    scheduleEndInput.addEventListener('change', () => {
      normalizeTimeInputDisplay(scheduleEndInput);
      updateSchedulePreview();
    });
    scheduleEndInput.addEventListener('blur', () => {
      normalizeTimeInputDisplay(scheduleEndInput);
      updateSchedulePreview();
    });
  }

  if (createForm && createForm.statPayEnabled) {
    createForm.statPayEnabled.addEventListener('change', syncStatPaySignatureUi);
  }
  if (editForm && editForm.statPayEnabled) {
    editForm.statPayEnabled.addEventListener('change', syncStatPaySignatureUi);
  }
  syncStatPaySignatureUi();

  if (schedulePickerBtn && schedulePickerSection) {
    schedulePickerBtn.addEventListener('click', () => {
      schedulePickerSection.hidden = false;
      if (schedulePickerMsg) hideMessage(schedulePickerMsg);
      updateSchedulePreview();
      openPortalDrawerById('jobsiteSchedulePickerSection');
    });
  }

  if (scheduleApplyBtn && createForm) {
    scheduleApplyBtn.addEventListener('click', () => {
      if (schedulePickerMsg) hideMessage(schedulePickerMsg);

      const dateValue = String(scheduleDateInput?.value || '').trim();
      const startValue = String(scheduleStartInput?.value || '').trim();
      const endValue = String(scheduleEndInput?.value || '').trim();

      if (!dateValue || !startValue || !endValue) {
        if (schedulePickerMsg) setMessage(schedulePickerMsg, 'Select date, start time, and end time.', 'error');
        return;
      }

      const scheduleText = buildScheduleText(dateValue, startValue, endValue);
      if (!scheduleText) {
        if (schedulePickerMsg) setMessage(schedulePickerMsg, 'Invalid date/time selection. Use h:mm AM/PM.', 'error');
        return;
      }

      currentSchedule = scheduleText;
      closePortalDrawer();
      if (schedulePickerSection) schedulePickerSection.hidden = true;

      // Show preview
      const previewEl = document.getElementById('jobsiteCreateJobPreview');
      if (previewEl) {
        document.getElementById('previewCreateIndustry').textContent = createForm.industry.value || '—';
        document.getElementById('previewCreateTitle').textContent = createForm.title.value || '—';
        document.getElementById('previewCreateSchedule').textContent = scheduleText;
        const previewCreateStatPay = document.getElementById('previewCreateStatPay');
        const previewCreateStatPaySignature = document.getElementById('previewCreateStatPaySignature');
        const createStatPayChecked = Boolean(createForm.statPayEnabled && createForm.statPayEnabled.checked);
        if (previewCreateStatPay) previewCreateStatPay.textContent = createStatPayChecked ? 'Yes' : 'No';
        if (previewCreateStatPaySignature) {
          const signer = String(createStatPaySignatureInput?.value || '').trim();
          previewCreateStatPaySignature.textContent = createStatPayChecked && signer ? `Signed by: ${signer}` : '';
        }
        previewEl.style.display = '';
      }
    });
  }

  if (scheduleCancelBtn && schedulePickerSection) {
    scheduleCancelBtn.addEventListener('click', () => {
      closePortalDrawer();
      schedulePickerSection.hidden = true;
    });
  }

  const editScheduleBtn = document.getElementById('jobEditScheduleBtn');
  if (editScheduleBtn && schedulePickerSection) {
    editScheduleBtn.addEventListener('click', () => {
      schedulePickerSection.hidden = false;
      if (schedulePickerMsg) hideMessage(schedulePickerMsg);
      updateSchedulePreview();
      openPortalDrawerById('jobsiteSchedulePickerSection');
      const previewEl = document.getElementById('jobsiteCreateJobPreview');
      if (previewEl) previewEl.style.display = 'none';
    });
  }

  const confirmPublishBtn = document.getElementById('jobConfirmPublishBtn');
  if (confirmPublishBtn && createForm) {
    confirmPublishBtn.addEventListener('click', () => {
      createForm.dispatchEvent(new Event('submit'));
    });
  }

  if (cancelBtn && editSection) {
    cancelBtn.addEventListener('click', () => {
      editSection.style.display = 'none';
      if (editForm) editForm.reset();
      syncStatPaySignatureUi();
    });
  }

  if (cancelFormBtn && editSection) {
    cancelFormBtn.addEventListener('click', () => {
      editSection.style.display = 'none';
      if (editForm) editForm.reset();
      syncStatPaySignatureUi();
    });
  }

  // Delegated click handler for Edit buttons on job cards
  const jobsEl = document.getElementById('jobsiteJobs');
  if (jobsEl && editForm && editSection) {
    jobsEl.addEventListener('click', async (event) => {
      const btn = event.target.closest('[data-edit-job-id]');
      if (btn) {
        const id = btn.dataset.editJobId;
        editForm.jobId.value = id;
        editForm.title.value = btn.dataset.jobTitle || '';
        if (editForm.industry) editForm.industry.value = btn.dataset.jobIndustry || '';
        if (editForm.status) editForm.status.value = btn.dataset.jobStatus || 'open';
        if (editForm.statPayEnabled) editForm.statPayEnabled.checked = String(btn.dataset.jobStatPay || '0') === '1';
        if (editStatPaySignatureInput) editStatPaySignatureInput.value = String(btn.dataset.jobStatPaySignature || '');
        syncStatPaySignatureUi();
        editSection.style.display = '';
        editSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const applyStatusBtn = event.target.closest('[data-jobsite-apply-job-status]');
      if (applyStatusBtn) {
        const jobId = asInt(applyStatusBtn.dataset.jobsiteApplyJobStatus);
        const select = jobsEl.querySelector(`[data-jobsite-job-status="${jobId}"]`);
        const nextStatus = String(select?.value || '').trim();
        if (!Number.isInteger(jobId) || jobId < 1 || !nextStatus) return;

        const res = await apiFetch(`/api/portal/jobsite/jobs/${jobId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          setMessage(document.getElementById('jobsiteCreateJobMessage'), payload.error || 'Failed to update shift status.', 'error');
          return;
        }
        await loadJobsiteDashboard(currentUser);
        return;
      }
    });

    jobsEl.addEventListener('change', async (event) => {
      const statPayCheckbox = event.target.closest('[data-jobsite-stat-pay]');
      if (!statPayCheckbox) return;
      const jobId = asInt(statPayCheckbox.dataset.jobsiteStatPay);
      if (!Number.isInteger(jobId) || jobId < 1) return;

      let signature = '';
      if (statPayCheckbox.checked) {
        const prompted = window.prompt('Type your full name to electronically sign and approve STAT PAY for this shift:', currentUser?.name || '');
        if (prompted === null) {
          statPayCheckbox.checked = false;
          return;
        }
        signature = String(prompted || '').trim();
        if (signature.length < 2) {
          setMessage(document.getElementById('jobsiteCreateJobMessage'), 'A typed client signature is required for STAT PAY.', 'error');
          statPayCheckbox.checked = false;
          return;
        }
      }

      const res = await apiFetch(`/api/portal/jobsite/jobs/${jobId}/stat-pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statPayEnabled: statPayCheckbox.checked, signature }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setMessage(document.getElementById('jobsiteCreateJobMessage'), payload.error || 'Failed to update STAT PAY.', 'error');
        statPayCheckbox.checked = !statPayCheckbox.checked;
        return;
      }
      await loadJobsiteDashboard(currentUser);
    });
  }

  const assignedWorkersTbody = document.getElementById('jobsiteAssignedWorkers');
  if (assignedWorkersTbody && assignedWorkersTbody.dataset.bound !== '1') {
    assignedWorkersTbody.dataset.bound = '1';
    assignedWorkersTbody.addEventListener('click', async (event) => {
      const applyBtn = event.target.closest('[data-jobsite-apply-assignment-status]');
      if (!applyBtn) return;

      const assignmentId = asInt(applyBtn.dataset.jobsiteApplyAssignmentStatus);
      const statusSelect = assignedWorkersTbody.querySelector(`[data-jobsite-assignment-status="${assignmentId}"]`);
      const nextStatus = String(statusSelect?.value || '').trim();
      if (!Number.isInteger(assignmentId) || assignmentId < 1 || !nextStatus) return;

      let reason = '';
      if (nextStatus === 'cancelled' || nextStatus === 'no_call_no_show') {
        const prompted = window.prompt('A reason is required for this status update:', '');
        if (prompted === null) return;
        reason = String(prompted || '').trim();
        if (!reason) {
          setMessage(document.getElementById('jobsiteCreateJobMessage'), 'A reason is required for this status.', 'error');
          return;
        }
      }

      const res = await apiFetch(`/api/portal/jobsite/assignments/${assignmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(document.getElementById('jobsiteCreateJobMessage'), payload.error || 'Failed to update assignment status.', 'error');
        return;
      }

      await loadJobsiteDashboard(currentUser);
    });
  }

  if (createForm) {
    const submitBtn = createForm.querySelector('button[type="submit"]');
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('jobsiteCreateJobMessage');
      hideMessage(msg);

      if (!currentSchedule) {
        setMessage(msg, 'Please pick a date and time first.', 'error');
        return;
      }

      const payload = {
        title: createForm.title.value.trim(),
        industry: createForm.industry.value.trim(),
        schedule: currentSchedule.trim(),
        statPayEnabled: Boolean(createForm.statPayEnabled && createForm.statPayEnabled.checked),
        statPaySignature: String(createStatPaySignatureInput?.value || '').trim(),
      };

      if (!payload.title || !payload.industry || !payload.schedule) {
        setMessage(msg, 'Title and schedule are required.', 'error');
        return;
      }
      if (payload.statPayEnabled && payload.statPaySignature.length < 2) {
        setMessage(msg, 'Type your full name to electronically sign STAT PAY.', 'error');
        return;
      }

      const res = await apiFetch('/api/portal/jobsite/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(msg, data.error || 'Failed to create job.', 'error');
        return;
      }

      createForm.reset();
      currentSchedule = '';
      if (scheduleDateInput) scheduleDateInput.value = '';
      if (scheduleStartInput) scheduleStartInput.value = '';
      if (scheduleEndInput) scheduleEndInput.value = '';
      if (createStatPaySignatureInput) createStatPaySignatureInput.value = '';
      syncStatPaySignatureUi();
      if (submitBtn) submitBtn.disabled = true;
      const previewEl = document.getElementById('jobsiteCreateJobPreview');
      if (previewEl) previewEl.style.display = 'none';
      setMessage(msg, 'Job created successfully.', 'success');
      await loadJobsiteDashboard(currentUser);
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('jobsiteEditJobMessage');
      hideMessage(msg);

      const jobId = asInt(editForm.jobId.value);
      const payload = {
        title: editForm.title.value.trim(),
        industry: editForm.industry.value.trim(),
        status: editForm.status.value,
        statPayEnabled: Boolean(editForm.statPayEnabled && editForm.statPayEnabled.checked),
        statPaySignature: String(editStatPaySignatureInput?.value || '').trim(),
      };

      if (!Number.isInteger(jobId) || jobId < 1) {
        setMessage(msg, 'Valid Job ID is required.', 'error');
        return;
      }

      if (!payload.title || !payload.industry) {
        setMessage(msg, 'Title and industry are required.', 'error');
        return;
      }
      if (payload.statPayEnabled && payload.statPaySignature.length < 2) {
        setMessage(msg, 'Type your full name to electronically sign STAT PAY.', 'error');
        return;
      }

      // Show preview
      const previewEl = document.getElementById('jobsiteEditJobPreview');
      const submitBtn = editForm.querySelector('button[type="submit"]');
      if (previewEl) {
        document.getElementById('previewEditIndustry').textContent = payload.industry;
        document.getElementById('previewEditTitle').textContent = payload.title;
        document.getElementById('previewEditStatus').textContent = (payload.status.charAt(0).toUpperCase() + payload.status.slice(1)) || '—';
        const previewStatPay = document.getElementById('previewEditStatPay');
        const previewEditStatPaySignature = document.getElementById('previewEditStatPaySignature');
        if (previewStatPay) previewStatPay.textContent = payload.statPayEnabled ? 'Yes' : 'No';
        if (previewEditStatPaySignature) {
          previewEditStatPaySignature.textContent = payload.statPayEnabled && payload.statPaySignature
            ? `Signed by: ${payload.statPaySignature}`
            : '';
        }
        previewEl.style.display = '';
        previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Store payload for later submission
      editForm.dataset.pendingPayload = JSON.stringify(payload);
    });
  }

  const editFormBackBtn = document.getElementById('jobEditFormBackBtn');
  if (editFormBackBtn && editForm) {
    editFormBackBtn.addEventListener('click', () => {
      const previewEl = document.getElementById('jobsiteEditJobPreview');
      if (previewEl) previewEl.style.display = 'none';
      editForm.dataset.pendingPayload = '';
    });
  }

  const confirmSaveBtn = document.getElementById('jobConfirmSaveBtn');
  if (confirmSaveBtn && editForm) {
    confirmSaveBtn.addEventListener('click', async () => {
      const msg = document.getElementById('jobsiteEditJobMessage');
      const previewEl = document.getElementById('jobsiteEditJobPreview');
      
      if (!editForm.dataset.pendingPayload) {
        setMessage(msg, 'No changes to save.', 'error');
        return;
      }

      const payload = JSON.parse(editForm.dataset.pendingPayload);
      const jobId = asInt(editForm.jobId.value);

      const res = await apiFetch(`/api/portal/jobsite/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(msg, data.error || 'Failed to update job.', 'error');
        return;
      }

      editForm.dataset.pendingPayload = '';
      if (previewEl) previewEl.style.display = 'none';
      setMessage(msg, 'Job updated successfully.', 'success');
      await loadJobsiteDashboard(currentUser);
    });
  }

  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', async () => {
      const msg = document.getElementById('jobsiteWithdrawMessage');
      hideMessage(msg);

      const confirmed = window.confirm('Withdraw your profile? This will permanently delete your jobsite account and related jobs.');
      if (!confirmed) return;

      const passcode = window.prompt('Enter your 4-digit passcode to withdraw your profile:');
      if (passcode === null) return;
      const normalizedPasscode = String(passcode).trim();
      if (!/^\d{4}$/.test(normalizedPasscode)) {
        setMessage(msg, 'A valid 4-digit passcode is required.', 'error');
        return;
      }

      withdrawBtn.disabled = true;
      const prevText = withdrawBtn.textContent;
      withdrawBtn.textContent = 'Withdrawing...';

      try {
        const res = await apiFetch('/api/portal/jobsite/profile', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: normalizedPasscode }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMessage(msg, data.error || 'Failed to withdraw profile.', 'error');
          return;
        }

        clearToken();
        const loginRoute = IS_FILE_PROTOCOL ? 'portal-login.html' : '/portal-login';
        window.location.href = `${loginRoute}?withdrawn=1`;
      } finally {
        withdrawBtn.disabled = false;
        withdrawBtn.textContent = prevText;
      }
    });
  }

  // ── Jobsite Timesheet Approvals ──────────────────────────────────────────
  const tsSection = document.getElementById('jobsiteTimesheetSection');
  const tsReviewCloseBtn = document.getElementById('jobsiteTimesheetReviewCloseBtn');
  const tsApproveBtn = document.getElementById('jobsiteTimesheetApproveBtn');

  if (tsReviewCloseBtn) {
    tsReviewCloseBtn.addEventListener('click', () => {
      const panel = document.getElementById('jobsiteTimesheetReviewPanel');
      if (panel) panel.style.display = 'none';
    });
  }

  // Delegated click on tbody: Review button
  const tsTbody = document.getElementById('jobsiteTimesheetsTbody');
  if (tsTbody && tsTbody.dataset.bound !== '1') {
    tsTbody.dataset.bound = '1';
    tsTbody.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-review-ts-id]');
      if (!btn) return;
      const tsId = asInt(btn.dataset.reviewTsId);
      const timesheets = (tsSection && tsSection._timesheets) || [];
      const ts = timesheets.find(t => t.id === tsId);
      if (ts) showJobsiteTimesheetReview(ts);
    });
  }

  if (tsApproveBtn && tsApproveBtn.dataset.bound !== '1') {
    tsApproveBtn.dataset.bound = '1';
    tsApproveBtn.addEventListener('click', async () => {
      const approveMsg = document.getElementById('jobsiteTimesheetApproveMessage');
      if (approveMsg) hideMessage(approveMsg);
      const signature = ((document.getElementById('jobsiteApprovalSignature') || {}).value || '').trim();
      const tsId = asInt(tsApproveBtn.dataset.timesheetId);

      if (!signature || signature.length < 2) {
        if (approveMsg) setMessage(approveMsg, 'Type your full name as a signature to approve.', 'error');
        return;
      }
      if (!Number.isInteger(tsId) || tsId < 1) {
        if (approveMsg) setMessage(approveMsg, 'Invalid timesheet.', 'error');
        return;
      }

      tsApproveBtn.disabled = true;
      const prevText = tsApproveBtn.textContent;
      tsApproveBtn.textContent = 'Approving…';

      try {
        const res = await apiFetch(`/api/portal/jobsite/timesheets/${tsId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signature }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (approveMsg) setMessage(approveMsg, payload.error || 'Failed to approve timesheet.', 'error');
          return;
        }
        // Hide approve form, show approved badge
        const approveForm = document.getElementById('jobsiteTimesheetApproveForm');
        const approvedBadge = document.getElementById('jobsiteTimesheetReviewApprovedBadge');
        const approvedDetail = document.getElementById('jobsiteTimesheetApprovedDetail');
        if (approveForm) approveForm.style.display = 'none';
        if (approvedBadge) approvedBadge.style.display = 'block';
        if (approvedDetail) approvedDetail.textContent = `Signed: ${signature} on ${formatDateOnly(new Date())}`;
        await loadJobsiteTimesheets();
      } finally {
        tsApproveBtn.disabled = false;
        tsApproveBtn.textContent = prevText;
      }
    });
  }

  const contractsTbody = document.getElementById('jobsiteContractsTbody');
  const contractReviewPanel = document.getElementById('jobsiteContractReviewPanel');
  const contractReviewCloseBtn = document.getElementById('jobsiteContractReviewCloseBtn');
  const contractReviewMsg = document.getElementById('jobsiteContractReviewMessage');
  const contractReviewMeta = document.getElementById('jobsiteContractReviewMeta');
  const contractViewLink = document.getElementById('jobsiteContractViewLink');
  const contractSignBtn = document.getElementById('jobsiteContractSignBtn');
  const contractDeclineBtn = document.getElementById('jobsiteContractDeclineBtn');
  const contractWithdrawBtn = document.getElementById('jobsiteContractWithdrawBtn');
  const contractSignatureInput = document.getElementById('jobsiteContractSignature');
  const contractAuthorizeInput = document.getElementById('jobsiteContractAuthorize');
  const contractReasonInput = document.getElementById('jobsiteContractDeclineReason');
  const contractCredentialInput = document.getElementById('jobsiteContractWithdrawCredential');

  if (contractReviewCloseBtn && contractReviewCloseBtn.dataset.bound !== '1') {
    contractReviewCloseBtn.dataset.bound = '1';
    contractReviewCloseBtn.addEventListener('click', () => {
      if (contractReviewPanel) contractReviewPanel.style.display = 'none';
    });
  }

  if (contractsTbody && contractsTbody.dataset.bound !== '1') {
    contractsTbody.dataset.bound = '1';
    contractsTbody.addEventListener('click', async (event) => {
      const reviewBtn = event.target.closest('[data-jobsite-contract-review-id]');
      if (!reviewBtn) return;
      const contractId = asInt(reviewBtn.dataset.jobsiteContractReviewId);
      if (!Number.isInteger(contractId) || contractId < 1) return;
      await openJobsiteContractReviewById(contractId);
    });
  }

  if (contractSignBtn && contractSignBtn.dataset.bound !== '1') {
    contractSignBtn.dataset.bound = '1';
    contractSignBtn.addEventListener('click', async () => {
      const contractId = asInt(contractSignBtn.dataset.contractId);
      if (!Number.isInteger(contractId) || contractId < 1) return;
      const res = await apiFetch(`/api/portal/jobsite/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureName: contractSignatureInput ? contractSignatureInput.value.trim() : '',
          authorized: contractAuthorizeInput ? contractAuthorizeInput.checked : false,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(contractReviewMsg, payload.error || 'Failed to sign contract.', 'error');
        return;
      }
      setMessage(contractReviewMsg, 'Contract signed successfully.', 'success');
      await loadJobsiteContracts();
    });
  }

  if (contractDeclineBtn && contractDeclineBtn.dataset.bound !== '1') {
    contractDeclineBtn.dataset.bound = '1';
    contractDeclineBtn.addEventListener('click', async () => {
      const contractId = asInt(contractDeclineBtn.dataset.contractId);
      if (!Number.isInteger(contractId) || contractId < 1) return;
      const res = await apiFetch(`/api/portal/jobsite/contracts/${contractId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: contractReasonInput ? contractReasonInput.value.trim() : '' }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(contractReviewMsg, payload.error || 'Failed to decline contract.', 'error');
        return;
      }
      setMessage(contractReviewMsg, 'Contract declined.', 'success');
      await loadJobsiteContracts();
    });
  }

  if (contractWithdrawBtn && contractWithdrawBtn.dataset.bound !== '1') {
    contractWithdrawBtn.dataset.bound = '1';
    contractWithdrawBtn.addEventListener('click', async () => {
      const contractId = asInt(contractWithdrawBtn.dataset.contractId);
      if (!Number.isInteger(contractId) || contractId < 1) return;
      const res = await apiFetch(`/api/portal/jobsite/contracts/${contractId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: contractReasonInput ? contractReasonInput.value.trim() : '',
          currentCredential: contractCredentialInput ? contractCredentialInput.value : '',
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(contractReviewMsg, payload.error || 'Failed to withdraw contract.', 'error');
        return;
      }
      setMessage(contractReviewMsg, 'Contract withdrawn.', 'success');
      await loadJobsiteContracts();
    });
  }

  // Contract cancellation initiation binding
  const cancelSubmitBtn = document.getElementById('jobsiteContractCancelSubmitBtn');
  const cancelCancelBtn = document.getElementById('jobsiteContractCancelCancelBtn');
  const cancelPanel = document.getElementById('jobsiteContractCancelPanel');
  const cancelMsg = document.getElementById('jobsiteContractCancelMessage');
  if (cancelSubmitBtn && cancelSubmitBtn.dataset.bound !== '1') {
    cancelSubmitBtn.dataset.bound = '1';
    cancelSubmitBtn.addEventListener('click', async () => {
      const contractId = asInt(cancelSubmitBtn.dataset.contractId);
      if (!Number.isInteger(contractId) || contractId < 1) return;
      const reason = (document.getElementById('jobsiteContractCancelReason') || {}).value?.trim() || '';
      const signature = (document.getElementById('jobsiteContractCancelSignature') || {}).value?.trim() || '';
      if (!reason) { setMessage(cancelMsg, 'A reason for cancellation is required.', 'error'); return; }
      if (!signature) { setMessage(cancelMsg, 'Your electronic signature is required.', 'error'); return; }
      cancelSubmitBtn.disabled = true;
      const res = await apiFetch(`/api/portal/jobsite/contracts/${contractId}/initiate-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureName: signature, reason }),
      });
      cancelSubmitBtn.disabled = false;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(cancelMsg, data.error || 'Failed to initiate cancellation.', 'error'); return; }
      setMessage(cancelMsg, 'Cancellation request submitted. An administrator will review and must co-sign to complete the process.', 'success');
      await loadJobsiteContracts();
    });
  }
  if (cancelCancelBtn && cancelCancelBtn.dataset.bound !== '1') {
    cancelCancelBtn.dataset.bound = '1';
    cancelCancelBtn.addEventListener('click', () => { if (cancelPanel) cancelPanel.style.display = 'none'; });
  }

  // Renewal decision bindings
  const renewBtn = document.getElementById('jobsiteContractRenewBtn');
  const denyRenewalBtn = document.getElementById('jobsiteContractDenyRenewalBtn');
  const renewalMsg = document.getElementById('jobsiteContractRenewalMessage');
  const renewSigRow = document.getElementById('jobsiteRenewalSignatureRow');
  if (renewBtn && renewBtn.dataset.bound !== '1') {
    renewBtn.dataset.bound = '1';
    renewBtn.addEventListener('click', () => { if (renewSigRow) renewSigRow.style.display = ''; });
    renewBtn.addEventListener('dblclick', async () => {
      const contractId = asInt(renewBtn.dataset.contractId);
      if (!Number.isInteger(contractId) || contractId < 1) return;
      const signature = (document.getElementById('jobsiteContractRenewalSignature') || {}).value?.trim() || '';
      if (!signature) { setMessage(renewalMsg, 'Your electronic signature is required to renew.', 'error'); return; }
      renewBtn.disabled = true;
      const res = await apiFetch(`/api/portal/jobsite/contracts/${contractId}/renewal-decision`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'renew', signatureName: signature }),
      });
      renewBtn.disabled = false;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(renewalMsg, data.error || 'Failed to submit renewal decision.', 'error'); return; }
      setMessage(renewalMsg, 'Renewal decision recorded. If both parties choose to renew, the contract will be extended for another year.', 'success');
      await loadJobsiteContracts();
    });
  }
  if (renewSigRow) {
    const confirmRenewBtn = document.createElement('button');
    confirmRenewBtn.className = 'button button--sm';
    confirmRenewBtn.type = 'button';
    confirmRenewBtn.textContent = 'Confirm Renewal';
    confirmRenewBtn.style.marginTop = '0.5rem';
    if (!renewSigRow.querySelector('[data-confirm-renew]')) {
      confirmRenewBtn.dataset.confirmRenew = '1';
      renewSigRow.appendChild(confirmRenewBtn);
      confirmRenewBtn.addEventListener('click', async () => {
        const contractId = asInt(renewBtn ? renewBtn.dataset.contractId : '0');
        if (!Number.isInteger(contractId) || contractId < 1) return;
        const signature = (document.getElementById('jobsiteContractRenewalSignature') || {}).value?.trim() || '';
        if (!signature) { setMessage(renewalMsg, 'Your electronic signature is required to renew.', 'error'); return; }
        confirmRenewBtn.disabled = true;
        const res = await apiFetch(`/api/portal/jobsite/contracts/${contractId}/renewal-decision`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'renew', signatureName: signature }),
        });
        confirmRenewBtn.disabled = false;
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setMessage(renewalMsg, data.error || 'Failed.', 'error'); return; }
        setMessage(renewalMsg, 'Renewal decision recorded. If both parties choose to renew, the contract will be extended for another year.', 'success');
        await loadJobsiteContracts();
      });
    }
  }
  if (denyRenewalBtn && denyRenewalBtn.dataset.bound !== '1') {
    denyRenewalBtn.dataset.bound = '1';
    denyRenewalBtn.addEventListener('click', async () => {
      const contractId = asInt(denyRenewalBtn.dataset.contractId);
      if (!Number.isInteger(contractId) || contractId < 1) return;
      if (!window.confirm('Are you sure you want to deny the contract renewal? This will cause the contract to expire.')) return;
      denyRenewalBtn.disabled = true;
      const res = await apiFetch(`/api/portal/jobsite/contracts/${contractId}/renewal-decision`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'deny' }),
      });
      denyRenewalBtn.disabled = false;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(renewalMsg, data.error || 'Failed.', 'error'); return; }
      setMessage(renewalMsg, 'Renewal denied. This contract will expire.', 'success');
      await loadJobsiteContracts();
    });
  }
}

function bindAdminForms(currentUser) {
  const assignForm = document.getElementById('adminAssignForm');

  const accountForm = document.getElementById('adminAccountForm');
  const usersTbody = document.getElementById('adminUsersTbody');
  const usersSelectAll = document.getElementById('adminUsersSelectAll');
  const usersBulkDeleteBtn = document.getElementById('adminUsersBulkDeleteBtn');
  const usersBulkClearBtn = document.getElementById('adminUsersBulkClearBtn');
  const adminJobsTbody = document.getElementById('adminJobsTbody');
  const excuseFormsTbody = document.getElementById('adminExcuseFormsTbody');
  const employeesTbody = document.getElementById('adminEmployeesTbody');
  const closeEmployeeDetailBtn = document.getElementById('adminEmployeeDetailCloseBtn');
  const backgroundSaveBtn = document.getElementById('adminEmployeeBackgroundSaveBtn');
  const backgroundUploadForm = document.getElementById('adminBackgroundUploadForm');
  const checklistUploadForm = document.getElementById('adminChecklistUploadForm');
  const checklistUploadCancelBtn = document.getElementById('adminChecklistUploadCancelBtn');
  const downloadAllFilesBtn = document.getElementById('adminEmployeeDownloadAllFilesBtn');

  if (closeEmployeeDetailBtn) {
    closeEmployeeDetailBtn.addEventListener('click', hideAdminEmployeeDetail);
  }

  if (backgroundSaveBtn) {
    backgroundSaveBtn.addEventListener('click', async () => {
      const employeeId = adminState.selectedEmployeeId;
      const statusSelect = document.getElementById('adminEmployeeBackgroundStatus');
      const msg = document.getElementById('adminBackgroundStatusMessage');
      hideMessage(msg);

      if (!Number.isInteger(employeeId) || employeeId < 1) {
        setMessage(msg, 'Select an employee profile first.', 'error');
        return;
      }

      const status = String(statusSelect?.value || '').trim().toLowerCase();
      if (!['passed', 'needs_further_attention'].includes(status)) {
        setMessage(msg, 'Choose a valid background status.', 'error');
        return;
      }

      backgroundSaveBtn.disabled = true;
      const prevText = backgroundSaveBtn.textContent;
      backgroundSaveBtn.textContent = 'Saving...';

      try {
        const res = await apiFetch(`${getScopedEmployeeApiBasePath()}/${employeeId}/background-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(msg, data.error || 'Failed to save background status.', 'error');
          return;
        }

        setMessage(msg, `Background status updated: ${formatBackgroundStatus(status)}.`, 'success');
        await loadAdminDashboard(currentUser);
        await loadAdminEmployeeDetail(employeeId);
      } finally {
        backgroundSaveBtn.disabled = false;
        backgroundSaveBtn.textContent = prevText;
      }
    });
  }

  if (backgroundUploadForm) {
    backgroundUploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const employeeId = adminState.selectedEmployeeId;
      const msg = document.getElementById('adminBackgroundUploadMessage');
      const uploadBtn = document.getElementById('adminBackgroundUploadBtn');
      hideMessage(msg);

      if (!Number.isInteger(employeeId) || employeeId < 1) {
        setMessage(msg, 'Select an employee profile first.', 'error');
        return;
      }

      const fileInput = backgroundUploadForm.document;
      const file = fileInput && fileInput.files ? fileInput.files[0] : null;
      if (!file) {
        setMessage(msg, 'Please choose a background document to upload.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('document', file);

      uploadBtn.disabled = true;
      const prevText = uploadBtn.textContent;
      uploadBtn.textContent = 'Uploading...';

      try {
        const res = await apiFetch(`${getScopedEmployeeApiBasePath()}/${employeeId}/background-document`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(msg, data.error || 'Failed to upload background document.', 'error');
          return;
        }

        setMessage(msg, 'Background document uploaded successfully.', 'success');
        backgroundUploadForm.reset();
        await loadAdminDashboard(currentUser);
        await loadAdminEmployeeDetail(employeeId);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = prevText;
      }
    });
  }

  if (checklistUploadCancelBtn) {
    checklistUploadCancelBtn.addEventListener('click', () => {
      closeAdminChecklistUploadForm();
    });
  }

  if (checklistUploadForm) {
    checklistUploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const employeeId = adminState.selectedEmployeeId;
      const msg = document.getElementById('adminChecklistUploadMessage');
      const uploadBtn = document.getElementById('adminChecklistUploadSubmitBtn');
      const typeInput = document.getElementById('adminChecklistUploadDocumentType');
      const expirationInput = document.getElementById('adminChecklistUploadExpirationDate');
      hideMessage(msg);

      if (!Number.isInteger(employeeId) || employeeId < 1) {
        setMessage(msg, 'Select an employee profile first.', 'error');
        return;
      }

      const documentType = String(typeInput?.value || '').trim().toLowerCase();
      if (!documentType) {
        setMessage(msg, 'Choose a checklist item before uploading.', 'error');
        return;
      }

      const fileInput = checklistUploadForm.document;
      const file = fileInput && fileInput.files ? fileInput.files[0] : null;
      if (!file) {
        setMessage(msg, 'Please choose a document to upload.', 'error');
        return;
      }

      const requiresExpiration = checklistUploadForm.dataset.requiresExpiration === '1';
      const expirationDate = String(expirationInput?.value || '').trim();
      if (requiresExpiration && !expirationDate) {
        setMessage(msg, 'This checklist item requires an expiration date.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('document', file);
      if (expirationDate) formData.append('expirationDate', expirationDate);

      uploadBtn.disabled = true;
      const previousText = uploadBtn.textContent;
      uploadBtn.textContent = 'Uploading...';

      try {
        const res = await apiFetch(`/api/admin/employees/${employeeId}/documents`, {
          method: 'POST',
          body: formData,
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(msg, payload.error || 'Failed to upload employee document.', 'error');
          return;
        }

        closeAdminChecklistUploadForm();
        await loadAdminDashboard(currentUser);
        await loadAdminEmployeeDetail(employeeId);
        const detailMsg = document.getElementById('adminEmployeeDetailMessage');
        setMessage(detailMsg, 'Employee document uploaded successfully.', 'success');
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = previousText;
      }
    });
  }

  if (downloadAllFilesBtn && downloadAllFilesBtn.dataset.bound !== '1') {
    downloadAllFilesBtn.dataset.bound = '1';
    downloadAllFilesBtn.addEventListener('click', () => {
      handleAdminEmployeeDocumentBundleDownload();
    });
  }

  // Document approve / deny delegation
  const employeeDetailSection = document.getElementById('adminEmployeeDetailSection');
  if (employeeDetailSection) {
    employeeDetailSection.addEventListener('click', async (event) => {
      // Checklist document view
      const checklistViewBtn = event.target.closest('[data-checklist-view-url]');
      if (checklistViewBtn) {
        const fileUrl = String(checklistViewBtn.dataset.checklistViewUrl || '').trim();
        if (fileUrl) window.open(fileUrl, '_blank', 'noopener');
        return;
      }

      const checklistUploadBtn = event.target.closest('[data-admin-checklist-upload-type]');
      if (checklistUploadBtn) {
        openAdminChecklistUploadFormForItem({
          documentType: checklistUploadBtn.dataset.adminChecklistUploadType,
          label: checklistUploadBtn.dataset.adminChecklistUploadLabel,
          requiresExpiration: checklistUploadBtn.dataset.adminChecklistUploadExpiration === '1',
        });
        return;
      }

      // SSN view
      const ssnViewBtn = event.target.closest('#adminSsnViewBtn');
      if (ssnViewBtn) {
        const empId = asInt(ssnViewBtn.dataset.employeeId);
        if (!Number.isInteger(empId) || empId < 1) return;
        ssnViewBtn.disabled = true;
        const ssnValueEl = document.getElementById('adminSsnValue');
        try {
          const res = await apiFetch(`${getScopedEmployeeApiBasePath()}/${empId}/ssn`);
          const payload = await res.json().catch(() => ({}));
          if (!res.ok || !payload.ssn) {
            if (ssnValueEl) ssnValueEl.textContent = 'Unable to retrieve SSN.';
            return;
          }
          if (ssnValueEl) ssnValueEl.innerHTML = `<span style="font-family:monospace;letter-spacing:0.05em;">${escapeHtml(payload.ssn)}</span>`;
          ssnViewBtn.textContent = 'Hide';
          ssnViewBtn.removeAttribute('id');
          ssnViewBtn.addEventListener('click', () => {
            if (ssnValueEl) ssnValueEl.innerHTML = '<span class="badge badge--green">On File (Encrypted)</span>';
          }, { once: true });
        } finally {
          ssnViewBtn.disabled = false;
        }
        return;
      }

      const taxDetailBtn = event.target.closest('[data-tax-form-details]');
      if (taxDetailBtn) {
        const formType = String(taxDetailBtn.dataset.taxFormDetails || '').trim().toLowerCase();
        renderAdminTaxFormDetail(formType);
        return;
      }

      const taxDetailCloseBtn = event.target.closest('#adminTaxFormDetailCloseBtn');
      if (taxDetailCloseBtn) {
        const panel = document.getElementById('adminTaxFormDetailPanel');
        const body = document.getElementById('adminTaxFormDetailBody');
        const detailMsg = document.getElementById('adminTaxFormDetailMessage');
        if (panel) panel.hidden = true;
        if (body) body.innerHTML = '';
        if (detailMsg) setMessage(detailMsg, 'Select a tax form to review.', 'neutral');
        return;
      }

      const onboardingDetailBtn = event.target.closest('[data-onboarding-form-details]');
      if (onboardingDetailBtn) {
        const formType = String(onboardingDetailBtn.dataset.onboardingFormDetails || '').trim().toLowerCase();
        const panel = document.getElementById('adminOnboardingFormDetailPanel');
        const body = document.getElementById('adminOnboardingFormDetailBody');
        const detailMsg = document.getElementById('adminOnboardingFormDetailMessage');
        if (!panel || !body || !detailMsg) return;

        if (formType === 'background-consent' && adminState.selectedEmployeeDetail && adminState.selectedEmployeeDetail.backgroundConsentForm) {
          const form = adminState.selectedEmployeeDetail.backgroundConsentForm;
          const noticeUrl = getSignedOnboardingFormUrl('background-consent', adminState.selectedEmployeeDetail.employee && adminState.selectedEmployeeDetail.employee.id);
          body.innerHTML = `
            <div class="profile-info__item"><span class="profile-info__label">Form</span><span>Background Acknowledgment & Consent</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Legal Name</span><span>${escapeHtml(form.legalName || 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Signature</span><span>${escapeHtml(form.signatureName || 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Signed Date</span><span>${escapeHtml(form.signedDate ? formatDateOnly(form.signedDate) : 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Last Updated</span><span>${escapeHtml(form.updatedAt ? formatDateTime(form.updatedAt) : 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Consent Version</span><span>${escapeHtml(form.consentVersion || 'v1')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">IP Address</span><span>${escapeHtml(form.ipAddress || 'Not stored')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">User Agent</span><span>${escapeHtml(form.userAgent || 'Not stored')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Completed Copy</span><span><a class="link" href="${escapeHtml(noticeUrl)}" target="_blank" rel="noopener">Open signed form</a></span></div>
          `;
          setMessage(detailMsg, 'Signed background consent record loaded.', 'success');
        } else if (formType === 'hipaa-compliance' && adminState.selectedEmployeeDetail && adminState.selectedEmployeeDetail.hipaaComplianceForm) {
          const form = adminState.selectedEmployeeDetail.hipaaComplianceForm;
          const noticeUrl = getSignedOnboardingFormUrl('hipaa-compliance', adminState.selectedEmployeeDetail.employee && adminState.selectedEmployeeDetail.employee.id);
          body.innerHTML = `
            <div class="profile-info__item"><span class="profile-info__label">Form</span><span>HIPAA Compliance & Confidentiality</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Legal Name</span><span>${escapeHtml(form.legalName || 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Signature</span><span>${escapeHtml(form.signatureName || 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Signed Date</span><span>${escapeHtml(form.signedDate ? formatDateOnly(form.signedDate) : 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Last Updated</span><span>${escapeHtml(form.updatedAt ? formatDateTime(form.updatedAt) : 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Policy Version</span><span>${escapeHtml(form.policyVersion || 'v1')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">IP Address</span><span>${escapeHtml(form.ipAddress || 'Not stored')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">User Agent</span><span>${escapeHtml(form.userAgent || 'Not stored')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Completed Copy</span><span><a class="link" href="${escapeHtml(noticeUrl)}" target="_blank" rel="noopener">Open signed form</a></span></div>
          `;
          setMessage(detailMsg, 'Signed HIPAA compliance record loaded.', 'success');
        } else if (formType === 'employee-handbook' && adminState.selectedEmployeeDetail && adminState.selectedEmployeeDetail.handbookForm) {
          const form = adminState.selectedEmployeeDetail.handbookForm;
          const noticeUrl = getSignedOnboardingFormUrl('employee-handbook', adminState.selectedEmployeeDetail.employee && adminState.selectedEmployeeDetail.employee.id);
          body.innerHTML = `
            <div class="profile-info__item"><span class="profile-info__label">Form</span><span>Employee Handbook</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Legal Name</span><span>${escapeHtml(form.legalName || 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Signature</span><span>${escapeHtml(form.signatureName || 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Signed Date</span><span>${escapeHtml(form.signedDate ? formatDateOnly(form.signedDate) : 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Last Updated</span><span>${escapeHtml(form.updatedAt ? formatDateTime(form.updatedAt) : 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Handbook Version</span><span>${escapeHtml(form.handbookVersion || 'v1')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">IP Address</span><span>${escapeHtml(form.ipAddress || 'Not stored')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">User Agent</span><span>${escapeHtml(form.userAgent || 'Not stored')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Completed Copy</span><span><a class="link" href="${escapeHtml(noticeUrl)}" target="_blank" rel="noopener">Open signed form</a></span></div>
          `;
          setMessage(detailMsg, 'Signed Employee Handbook record loaded.', 'success');
        } else if (formType === 'compensation-agreement' && adminState.selectedEmployeeDetail && adminState.selectedEmployeeDetail.compensationAgreementForm) {
          const form = adminState.selectedEmployeeDetail.compensationAgreementForm;
          const noticeUrl = getSignedOnboardingFormUrl('compensation-agreement', adminState.selectedEmployeeDetail.employee && adminState.selectedEmployeeDetail.employee.id);
          body.innerHTML = `
            <div class="profile-info__item"><span class="profile-info__label">Form</span><span>Healthcare Compensation Agreement</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Legal Name</span><span>${escapeHtml(form.legalName || 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Signature</span><span>${escapeHtml(form.signatureName || 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Signed Date</span><span>${escapeHtml(form.signedDate ? formatDateOnly(form.signedDate) : 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Last Updated</span><span>${escapeHtml(form.updatedAt ? formatDateTime(form.updatedAt) : 'N/A')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Agreement Version</span><span>${escapeHtml(form.agreementVersion || 'v1')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">IP Address</span><span>${escapeHtml(form.ipAddress || 'Not stored')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">User Agent</span><span>${escapeHtml(form.userAgent || 'Not stored')}</span></div>
            <div class="profile-info__item"><span class="profile-info__label">Completed Copy</span><span><a class="link" href="${escapeHtml(noticeUrl)}" target="_blank" rel="noopener">Open signed form</a></span></div>
          `;
          setMessage(detailMsg, 'Signed Healthcare Compensation Agreement record loaded.', 'success');
        } else {
          body.innerHTML = '';
          setMessage(detailMsg, 'No onboarding form details are available for this employee.', 'error');
        }

        panel.hidden = false;
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      const onboardingDetailCloseBtn = event.target.closest('#adminOnboardingFormDetailCloseBtn');
      if (onboardingDetailCloseBtn) {
        const panel = document.getElementById('adminOnboardingFormDetailPanel');
        const body = document.getElementById('adminOnboardingFormDetailBody');
        const detailMsg = document.getElementById('adminOnboardingFormDetailMessage');
        if (panel) panel.hidden = true;
        if (body) body.innerHTML = '';
        if (detailMsg) setMessage(detailMsg, 'Select an onboarding form to review.', 'neutral');
        return;
      }

      const approveBtn = event.target.closest('[data-approve-doc-id]');
      const denyBtn = event.target.closest('[data-deny-doc-id]');
      const remindBtn = event.target.closest('[data-remind-doc-type]');
      const btn = approveBtn || denyBtn;

      // Timesheet view entries button
      const tsViewBtn2 = event.target.closest('[data-admin-ts-view-id]');
      if (tsViewBtn2) {
        const tsId = asInt(tsViewBtn2.dataset.adminTsViewId);
        showAdminTimesheetEntries(tsId, adminState.timesheets);
        return;
      }

      if (remindBtn) {
        const employeeId = asInt(remindBtn.dataset.remindEmployeeId);
        const documentType = String(remindBtn.dataset.remindDocType || '').trim().toLowerCase();
        const msg = document.getElementById('adminEmployeeDetailMessage');
        hideMessage(msg);

        if (!Number.isInteger(employeeId) || employeeId < 1 || !documentType) return;

        remindBtn.disabled = true;
        const previousText = remindBtn.textContent;
        remindBtn.textContent = 'Sending...';

        try {
          const res = await apiFetch(`${getScopedEmployeeApiBasePath()}/${employeeId}/document-reminders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentType }),
          });
          const payload = await res.json().catch(() => ({}));
          if (!res.ok) {
            setMessage(msg, payload.error || 'Failed to send reminder.', 'error');
            return;
          }
          const summary = formatReminderDeliverySummary(payload.delivery || {});
          setMessage(msg, summary ? `Reminder sent. ${summary}` : 'Document reminder sent to employee.', 'success');
        } catch {
          setMessage(msg, 'Failed to send reminder.', 'error');
        } finally {
          remindBtn.disabled = false;
          remindBtn.textContent = previousText;
        }
        return;
      }

      if (!btn) return;

      const action = approveBtn ? 'approved' : 'denied';
      const docId = asInt(btn.dataset.approveDocId || btn.dataset.denyDocId);
      const employeeId = asInt(btn.dataset.docEmployeeId);
      const msg = document.getElementById('adminEmployeeDetailMessage');
      hideMessage(msg);

      if (!Number.isInteger(docId) || !Number.isInteger(employeeId)) return;

      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = action === 'approved' ? 'Approving…' : 'Denying…';

      try {
        const res = await apiFetch(`${getScopedEmployeeApiBasePath()}/${employeeId}/documents/${docId}/review`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(msg, data.error || 'Failed to update document status.', 'error');
          btn.disabled = false;
          btn.textContent = prev;
          return;
        }
        setMessage(msg, `Document ${action} successfully. Employee has been notified.`, 'success');
        await loadAdminEmployeeDetail(employeeId);
      } catch {
        btn.disabled = false;
        btn.textContent = prev;
      }
    });
  }

  const adminTimesheetsSection = document.getElementById('adminTimesheetsSection');
  if (adminTimesheetsSection && adminTimesheetsSection.dataset.bound !== '1') {
    adminTimesheetsSection.dataset.bound = '1';
    adminTimesheetsSection.addEventListener('click', (event) => {
      const tsViewBtn = event.target.closest('[data-admin-ts-view-id]');
      if (!tsViewBtn) return;
      const tsId = asInt(tsViewBtn.dataset.adminTsViewId);
      if (!Number.isInteger(tsId) || tsId < 1) return;
      showAdminTimesheetEntries(tsId, adminState.timesheets);
    });
  }

  const adminTimesheetEmployeeFilter = document.getElementById('adminTimesheetEmployeeFilter');
  if (adminTimesheetEmployeeFilter && adminTimesheetEmployeeFilter.dataset.bound !== '1') {
    adminTimesheetEmployeeFilter.dataset.bound = '1';
    adminTimesheetEmployeeFilter.addEventListener('change', () => {
      renderAdminTimesheetsSection();
    });
  }

  const adminTimesheetStatusFilter = document.getElementById('adminTimesheetStatusFilter');
  if (adminTimesheetStatusFilter && adminTimesheetStatusFilter.dataset.bound !== '1') {
    adminTimesheetStatusFilter.dataset.bound = '1';
    adminTimesheetStatusFilter.addEventListener('change', () => {
      renderAdminTimesheetsSection();
    });
  }

  const adminTimesheetSourceFilter = document.getElementById('adminTimesheetSourceFilter');
  if (adminTimesheetSourceFilter && adminTimesheetSourceFilter.dataset.bound !== '1') {
    adminTimesheetSourceFilter.dataset.bound = '1';
    adminTimesheetSourceFilter.addEventListener('change', () => {
      renderAdminTimesheetsSection();
    });
  }

  const adminTimesheetExportCsvBtn = document.getElementById('adminTimesheetExportCsvBtn');
  if (adminTimesheetExportCsvBtn && adminTimesheetExportCsvBtn.dataset.bound !== '1') {
    adminTimesheetExportCsvBtn.dataset.bound = '1';
    adminTimesheetExportCsvBtn.addEventListener('click', async () => {
      await downloadTimesheetSummaryCsv({
        periodSelectId: 'adminTimesheetExportPeriod',
        messageId: 'adminTimesheetMessage',
        employeeFilterId: 'adminTimesheetEmployeeFilter',
        statusFilterId: 'adminTimesheetStatusFilter',
        sourceFilterId: 'adminTimesheetSourceFilter',
      });
    });
  }

  const adminManualTsEmployee = document.getElementById('adminManualTsEmployee');
  if (adminManualTsEmployee && adminManualTsEmployee.dataset.bound !== '1') {
    adminManualTsEmployee.dataset.bound = '1';
    adminManualTsEmployee.addEventListener('change', async () => {
      const employeeId = asInt(adminManualTsEmployee.value);
      await loadAdminManualTimesheetAssignments(employeeId);
    });
  }

  // Admin timesheet entries panel close
  const adminTsEntriesCloseBtn = document.getElementById('adminTimesheetEntriesCloseBtn');
  if (adminTsEntriesCloseBtn) {
    adminTsEntriesCloseBtn.addEventListener('click', () => {
      const panel = document.getElementById('adminTimesheetEntriesPanel');
      if (panel) panel.style.display = 'none';
    });
  }

  // Admin manual timesheet: Add Entry Row button
  const addEntryBtn = document.getElementById('adminManualTsAddEntryBtn');
  if (addEntryBtn && addEntryBtn.dataset.bound !== '1') {
    addEntryBtn.dataset.bound = '1';
    addEntryBtn.addEventListener('click', () => {
      const container = document.getElementById('adminManualTsEntriesContainer');
      if (container) addAdminManualTsEntryRow(container);
    });
  }

  const adminManualEntriesContainer = document.getElementById('adminManualTsEntriesContainer');
  if (adminManualEntriesContainer && adminManualEntriesContainer.dataset.bound !== '1') {
    adminManualEntriesContainer.dataset.bound = '1';
    adminManualEntriesContainer.addEventListener('focusout', (event) => {
      const target = event.target;
      if (target && target.matches && target.matches('.ts-manual-clock-in, .ts-manual-clock-out')) {
        normalizeTimeInputDisplay(target);
      }
    });
  }

  // Admin manual timesheet submit
  const adminManualTsSubmitBtn = document.getElementById('adminManualTsSubmitBtn');
  if (adminManualTsSubmitBtn && adminManualTsSubmitBtn.dataset.bound !== '1') {
    adminManualTsSubmitBtn.dataset.bound = '1';
    adminManualTsSubmitBtn.addEventListener('click', async () => {
      const msg = document.getElementById('adminManualTimesheetMessage');
      if (msg) hideMessage(msg);

      const manualEmployeeSelect = document.getElementById('adminManualTsEmployee');
      const employeeId = manualEmployeeSelect ? asInt(manualEmployeeSelect.value) : NaN;
      if (!Number.isInteger(employeeId) || employeeId < 1) {
        if (msg) setMessage(msg, 'Select an employee first.', 'error');
        return;
      }

      const assignSel = document.getElementById('adminManualTsAssignment');
      const assignmentId = assignSel ? asInt(assignSel.value) : null;
      const periodStart = (document.getElementById('adminManualTsPeriodStart') || {}).value || '';
      const periodEnd = (document.getElementById('adminManualTsPeriodEnd') || {}).value || '';
      const notes = (document.getElementById('adminManualTsNotes') || {}).value || '';

      if (!periodStart || !periodEnd) {
        if (msg) setMessage(msg, 'Period start and end dates are required.', 'error');
        return;
      }

      const container = document.getElementById('adminManualTsEntriesContainer');
      const entryRows = container ? container.querySelectorAll('.admin-ts-entry-row') : [];
      const entries = [];
      let entryError = null;
      entryRows.forEach((row, i) => {
        const date = (row.querySelector('.ts-manual-date') || {}).value || '';
        const clockInTime = (row.querySelector('.ts-manual-clock-in') || {}).value || '';
        const clockOutTime = (row.querySelector('.ts-manual-clock-out') || {}).value || '';
        const clockIn24 = parseUsTimeTo24(clockInTime);
        const clockOut24 = parseUsTimeTo24(clockOutTime);
        const entryNotes = (row.querySelector('.ts-manual-entry-notes') || {}).value || '';
        if (!date || !clockInTime || !clockOutTime) {
          entryError = `Row ${i + 1}: date, clock-in, and clock-out are all required.`;
          return;
        }
        if (!clockIn24 || !clockOut24) {
          entryError = `Row ${i + 1}: time must be in h:mm AM/PM format.`;
          return;
        }
        entries.push({
          date,
          clockIn: `${date}T${clockIn24}:00`,
          clockOut: `${date}T${clockOut24}:00`,
          entryNotes,
        });
      });

      if (entryError) {
        if (msg) setMessage(msg, entryError, 'error');
        return;
      }
      if (entries.length === 0) {
        if (msg) setMessage(msg, 'Add at least one time entry row.', 'error');
        return;
      }

      adminManualTsSubmitBtn.disabled = true;
      const prevText = adminManualTsSubmitBtn.textContent;
      adminManualTsSubmitBtn.textContent = 'Submitting…';

      try {
        const res = await apiFetch('/api/admin/timesheets/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeUserId: employeeId,
            assignmentId: Number.isInteger(assignmentId) && assignmentId > 0 ? assignmentId : null,
            periodStart,
            periodEnd,
            entries,
            notes,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (msg) setMessage(msg, payload.error || 'Failed to submit manual timesheet.', 'error');
          return;
        }
        if (msg) setMessage(msg, 'Manual timesheet submitted for jobsite approval.', 'success');
        // Reset form
        if (document.getElementById('adminManualTsPeriodStart')) document.getElementById('adminManualTsPeriodStart').value = '';
        if (document.getElementById('adminManualTsPeriodEnd')) document.getElementById('adminManualTsPeriodEnd').value = '';
        if (document.getElementById('adminManualTsNotes')) document.getElementById('adminManualTsNotes').value = '';
        if (container) { container.innerHTML = ''; addAdminManualTsEntryRow(container); }
        await loadAdminDashboard(currentUser);
        if (manualEmployeeSelect) manualEmployeeSelect.value = String(employeeId);
        await loadAdminManualTimesheetAssignments(employeeId);
      } finally {
        adminManualTsSubmitBtn.disabled = false;
        adminManualTsSubmitBtn.textContent = prevText;
      }
    });
  }

  if (employeesTbody) {
    employeesTbody.addEventListener('click', async (event) => {
      const viewBtn = event.target.closest('[data-view-employee-id]');
      if (!viewBtn) return;

      const employeeId = asInt(viewBtn.dataset.viewEmployeeId);
      if (!Number.isInteger(employeeId) || employeeId < 1) return;

      viewBtn.disabled = true;
      const prevText = viewBtn.textContent;
      viewBtn.textContent = 'Loading...';

      try {
        await loadAdminEmployeeDetail(employeeId);
      } finally {
        viewBtn.disabled = false;
        viewBtn.textContent = prevText;
      }
    });
  }

  if (adminJobsTbody && adminJobsTbody.dataset.bound !== '1') {
    adminJobsTbody.dataset.bound = '1';
    adminJobsTbody.addEventListener('click', async (event) => {
      const msg = document.getElementById('adminUserMessage') || document.getElementById('adminTimesheetMessage');
      if (msg) hideMessage(msg);

      const applyJobBtn = event.target.closest('[data-admin-apply-job-status]');
      if (applyJobBtn) {
        const jobId = asInt(applyJobBtn.dataset.adminApplyJobStatus);
        const statusSelect = adminJobsTbody.querySelector(`[data-admin-job-status="${jobId}"]`);
        const status = String(statusSelect?.value || '').trim();
        if (!Number.isInteger(jobId) || jobId < 1 || !status) return;

        const res = await apiFetch(`/api/admin/jobs/${jobId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (msg) setMessage(msg, payload.error || 'Failed to update shift status.', 'error');
          return;
        }
        await loadAdminDashboard(currentUser);
        return;
      }

      const applyAssignmentBtn = event.target.closest('[data-admin-apply-assignment-status]');
      if (!applyAssignmentBtn) return;

      const assignmentId = asInt(applyAssignmentBtn.dataset.adminApplyAssignmentStatus);
      const statusSelect = adminJobsTbody.querySelector(`[data-admin-assignment-status="${assignmentId}"]`);
      const status = String(statusSelect?.value || '').trim();
      if (!Number.isInteger(assignmentId) || assignmentId < 1 || !status) return;

      let reason = '';
      if (status === 'cancelled' || status === 'no_call_no_show') {
        const prompted = window.prompt('A reason is required for this status update:', '');
        if (prompted === null) return;
        reason = String(prompted || '').trim();
        if (!reason) {
          if (msg) setMessage(msg, 'A reason is required for this status.', 'error');
          return;
        }
      }

      const res = await apiFetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (msg) setMessage(msg, payload.error || 'Failed to update assignment status.', 'error');
        return;
      }

      await loadAdminDashboard(currentUser);
    });
  }

  if (excuseFormsTbody && excuseFormsTbody.dataset.bound !== '1') {
    excuseFormsTbody.dataset.bound = '1';
    excuseFormsTbody.addEventListener('click', async (event) => {
      const approveBtn = event.target.closest('[data-admin-approve-excuse-id]');
      const denyBtn = event.target.closest('[data-admin-deny-excuse-id]');
      if (!approveBtn && !denyBtn) return;

      const msg = document.getElementById('adminExcuseFormsMessage');
      if (msg) hideMessage(msg);

      const excuseFormId = asInt((approveBtn || denyBtn).dataset.adminApproveExcuseId || (approveBtn || denyBtn).dataset.adminDenyExcuseId);
      if (!Number.isInteger(excuseFormId) || excuseFormId < 1) return;

      const isApprove = Boolean(approveBtn);
      const action = isApprove ? 'approved' : 'denied';
      let signature = '';
      if (isApprove) {
        const prompted = window.prompt('Type your full name to sign approval:', '');
        if (prompted === null) return;
        signature = String(prompted || '').trim();
        if (!signature) {
          if (msg) setMessage(msg, 'Signature is required to approve this excuse form.', 'error');
          return;
        }
      }

      const res = await apiFetch(`/api/admin/excuse-forms/${excuseFormId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, signature }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (msg) setMessage(msg, payload.error || 'Failed to review excuse form.', 'error');
        return;
      }

      if (msg) setMessage(msg, isApprove ? 'Excuse form approved and signed.' : 'Excuse form denied.', 'success');
      await loadAdminDashboard(currentUser);
    });
  }

  if (usersSelectAll && usersSelectAll.dataset.bound !== '1') {
    usersSelectAll.dataset.bound = '1';
    usersSelectAll.addEventListener('change', () => {
      if (!usersTbody) return;
      const rowChecks = usersTbody.querySelectorAll('.admin-user-row-check:not(:disabled)');
      rowChecks.forEach((checkbox) => {
        checkbox.checked = usersSelectAll.checked;
      });
      updateAdminUsersBulkBar();
    });
  }

  if (usersTbody && usersTbody.dataset.bulkBound !== '1') {
    usersTbody.dataset.bulkBound = '1';
    usersTbody.addEventListener('change', (event) => {
      if (!event.target.closest('.admin-user-row-check')) return;
      updateAdminUsersBulkBar();
    });
  }

  if (usersBulkClearBtn && usersBulkClearBtn.dataset.bound !== '1') {
    usersBulkClearBtn.dataset.bound = '1';
    usersBulkClearBtn.addEventListener('click', () => {
      if (!usersTbody) return;
      const rowChecks = usersTbody.querySelectorAll('.admin-user-row-check:not(:disabled)');
      rowChecks.forEach((checkbox) => {
        checkbox.checked = false;
      });
      updateAdminUsersBulkBar();
    });
  }

  if (usersBulkDeleteBtn && usersBulkDeleteBtn.dataset.bound !== '1') {
    usersBulkDeleteBtn.dataset.bound = '1';
    usersBulkDeleteBtn.addEventListener('click', async () => {
      if (!usersTbody) return;
      const userMsg = document.getElementById('adminUserMessage');
      hideMessage(userMsg);

      const selectedChecks = Array.from(usersTbody.querySelectorAll('.admin-user-row-check:not(:disabled):checked'));
      if (!selectedChecks.length) {
        setMessage(userMsg, 'Select at least one user first.', 'error');
        return;
      }

      const selectedUsers = selectedChecks
        .map((checkbox) => ({
          id: asInt(checkbox.dataset.userId),
          name: String(checkbox.dataset.userName || 'User'),
          role: String(checkbox.dataset.userRole || '').toLowerCase(),
        }))
        .filter((item) => Number.isInteger(item.id) && item.id > 0);

      if (!selectedUsers.length) {
        setMessage(userMsg, 'Invalid bulk user selection.', 'error');
        return;
      }

      const sensitiveAuth = await resolveSensitiveActionAuthorization(
        'admin-user-delete',
        userMsg,
        'Enter your admin password or 4-digit passcode to confirm user deletion:'
      );
      if (sensitiveAuth === null) return;

      const confirmed = window.confirm(`Delete ${selectedUsers.length} selected users? This action cannot be undone.`);
      if (!confirmed) return;

      const requiresCredential = selectedUsers.some((item) => item.role === 'employee');
      let currentCredential = sensitiveAuth.currentCredential || '';
      if (requiresCredential) {
        if (!currentCredential) {
          const prompted = window.prompt('Enter your admin password or 4-digit passcode to confirm employee deletion:');
          if (prompted === null) return;
          currentCredential = String(prompted);
        }
        if (!currentCredential.trim()) {
          setMessage(userMsg, 'Admin password or passcode is required to delete employees.', 'error');
          return;
        }
      }

      usersBulkDeleteBtn.disabled = true;
      const prevText = usersBulkDeleteBtn.textContent;
      usersBulkDeleteBtn.textContent = 'Deleting...';

      let successCount = 0;
      const failures = [];

      try {
        for (const user of selectedUsers) {
          try {
            const requestOptions = { method: 'DELETE' };
            if (sensitiveAuth.passkeyProof) {
              requestOptions.headers = Object.assign({}, requestOptions.headers || {}, { 'X-Passkey-Proof': sensitiveAuth.passkeyProof });
            }
            if (user.role === 'employee') {
              requestOptions.headers = Object.assign({}, requestOptions.headers || {}, { 'Content-Type': 'application/json' });
              requestOptions.body = JSON.stringify({ currentCredential });
            } else if (currentCredential) {
              requestOptions.headers = Object.assign({}, requestOptions.headers || {}, { 'Content-Type': 'application/json' });
              requestOptions.body = JSON.stringify({ currentCredential });
            }

            const res = await apiFetch(`/api/admin/users/${user.id}`, requestOptions);
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              failures.push(`${user.name}: ${data.error || 'Delete failed.'}`);
              continue;
            }

            successCount += 1;
          } catch {
            failures.push(`${user.name}: Delete failed.`);
          }
        }

        if (successCount > 0 && failures.length === 0) {
          setMessage(userMsg, `${successCount} users deleted successfully.`, 'success');
          await loadAdminDashboard(currentUser);
          return;
        }

        if (successCount > 0 && failures.length > 0) {
          setMessage(userMsg, `${successCount} users deleted. ${failures.length} failed.`, 'success');
          await loadAdminDashboard(currentUser);
          return;
        }

        setMessage(userMsg, failures[0] || 'Failed to delete selected users.', 'error');
      } finally {
        usersBulkDeleteBtn.disabled = false;
        usersBulkDeleteBtn.textContent = prevText;
        updateAdminUsersBulkBar();
      }
    });
  }

  if (usersTbody) {
    usersTbody.addEventListener('click', async (event) => {
      const manageBtn = event.target.closest('[data-manage-user-id]');
      if (!manageBtn) return;

      const userMsg = document.getElementById('adminUserMessage');
      hideMessage(userMsg);

      const userId = asInt(manageBtn.dataset.manageUserId);
      const userName = manageBtn.dataset.manageUserName || 'this user';
      const userRole = String(manageBtn.dataset.manageUserRole || '').toLowerCase();

      if (!Number.isInteger(userId) || userId < 1) {
        setMessage(userMsg, 'Invalid user selection.', 'error');
        return;
      }

      let actionChoice = 'reset';
      if (userRole !== 'admin') {
        const promptOptions = userRole === 'jobsite'
          ? `Manage ${userName}: type RESET to reset password, DELETE to delete account, or INDUSTRY to change industry track.`
          : `Manage ${userName}: type RESET to reset password, or DELETE to delete account.`;
        const input = window.prompt(promptOptions);
        if (input === null) return;
        const normalized = String(input).trim().toLowerCase();
        const validChoices = userRole === 'jobsite' ? ['reset', 'delete', 'industry'] : ['reset', 'delete'];
        if (!validChoices.includes(normalized)) {
          setMessage(userMsg, userRole === 'jobsite' ? 'Please type RESET, DELETE, or INDUSTRY.' : 'Please type RESET or DELETE.', 'error');
          return;
        }
        actionChoice = normalized;
      }

      if (actionChoice === 'industry') {
        const trackInput = window.prompt(`Change industry track for ${userName}: type WAREHOUSE or HEALTHCARE.`);
        if (trackInput === null) return;
        const track = String(trackInput).trim().toLowerCase();
        if (!['warehouse', 'healthcare'].includes(track)) {
          setMessage(userMsg, 'Please type WAREHOUSE or HEALTHCARE.', 'error');
          return;
        }

        manageBtn.disabled = true;
        const prevText = manageBtn.textContent;
        manageBtn.textContent = 'Updating...';

        try {
          const res = await apiFetch(`/api/admin/users/${userId}/industry-track`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ industryTrack: track }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setMessage(userMsg, data.error || 'Failed to update industry track.', 'error');
            return;
          }
          setMessage(userMsg, `Industry track updated to ${track} for ${userName}.`, 'success');
          await loadAdminDashboard(currentUser);
        } finally {
          manageBtn.disabled = false;
          manageBtn.textContent = prevText;
        }
        return;
      }

      if (actionChoice === 'reset') {
        const newPassword = window.prompt(`Enter a new temporary password for ${userName} (minimum 8 characters):`);
        if (newPassword === null) return;
        if (String(newPassword).length < 8) {
          setMessage(userMsg, 'New password must be at least 8 characters.', 'error');
          return;
        }

        const sensitiveAuth = await resolveSensitiveActionAuthorization(
          'admin-password-reset',
          userMsg,
          'Enter your admin password or 4-digit passcode to confirm password reset:'
        );
        if (sensitiveAuth === null) return;

        manageBtn.disabled = true;
        const prevText = manageBtn.textContent;
        manageBtn.textContent = 'Resetting...';

        try {
          const res = await apiFetch(`/api/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: Object.assign(
              { 'Content-Type': 'application/json' },
              sensitiveAuth.passkeyProof ? { 'X-Passkey-Proof': sensitiveAuth.passkeyProof } : {}
            ),
            body: JSON.stringify({
              newPassword,
              currentCredential: sensitiveAuth.currentCredential || '',
              removePasscode: true,
            }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setMessage(userMsg, data.error || 'Failed to reset password.', 'error');
            return;
          }

          setMessage(userMsg, `Password reset for ${userName}. Their passcode has been cleared.`, 'success');
        } finally {
          manageBtn.disabled = false;
          manageBtn.textContent = prevText;
        }
        return;
      }

      const targetUser = (adminState.users || []).find((user) => Number(user.id) === userId);
      const isEmployee = String(targetUser?.role || '').toLowerCase() === 'employee';

      const sensitiveAuth = await resolveSensitiveActionAuthorization(
        'admin-user-delete',
        userMsg,
        'Enter your admin password or 4-digit passcode to confirm user deletion:'
      );
      if (sensitiveAuth === null) return;

      const confirmed = window.confirm(`Delete ${userName}? This action cannot be undone.`);
      if (!confirmed) return;

      let currentPassword = sensitiveAuth.currentCredential || '';
      if (isEmployee) {
        if (!currentPassword) {
          const promptValue = window.prompt('Enter your admin password or 4-digit passcode to confirm employee deletion:');
          if (promptValue === null) {
            return;
          }
          currentPassword = String(promptValue);
        }
        if (!currentPassword.trim()) {
          setMessage(userMsg, 'Admin password or passcode is required to delete an employee.', 'error');
          return;
        }
      }

      manageBtn.disabled = true;
      const prevText = manageBtn.textContent;
      manageBtn.textContent = 'Deleting...';

      try {
        const requestOptions = { method: 'DELETE' };
        if (sensitiveAuth.passkeyProof) {
          requestOptions.headers = Object.assign({}, requestOptions.headers || {}, { 'X-Passkey-Proof': sensitiveAuth.passkeyProof });
        }
        if (isEmployee) {
          requestOptions.headers = Object.assign({}, requestOptions.headers || {}, { 'Content-Type': 'application/json' });
          requestOptions.body = JSON.stringify({ currentCredential: currentPassword });
        } else if (currentPassword) {
          requestOptions.headers = Object.assign({}, requestOptions.headers || {}, { 'Content-Type': 'application/json' });
          requestOptions.body = JSON.stringify({ currentCredential: currentPassword });
        }

        const res = await apiFetch(`/api/admin/users/${userId}`, requestOptions);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setMessage(userMsg, data.error || 'Failed to delete user.', 'error');
          return;
        }

        setMessage(userMsg, 'User deleted successfully.', 'success');
        await loadAdminDashboard(currentUser);
      } finally {
        manageBtn.disabled = false;
        manageBtn.textContent = prevText;
      }
    });
  }

  if (assignForm) {
    assignForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('adminAssignMessage');
      hideMessage(msg);

      const payload = {
        jobId: asInt(assignForm.jobId.value),
        employeeUserId: asInt(assignForm.employeeUserId.value),
      };

      if (!Number.isInteger(payload.jobId) || !Number.isInteger(payload.employeeUserId)) {
        setMessage(msg, 'Valid job ID and employee user ID are required.', 'error');
        return;
      }

      const res = await apiFetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(msg, data.error || 'Failed to create assignment.', 'error');
        return;
      }

      assignForm.reset();
      setMessage(msg, 'Assignment created successfully.', 'success');
      await loadAdminDashboard(currentUser);
    });
  }



  if (accountForm) {
    bindPasskeyAccountControls(accountForm);
  }

  if (accountForm && accountForm.dataset.bound !== '1') {
    accountForm.dataset.bound = '1';
    accountForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('adminAccountMessage');
      hideMessage(msg);

      const payload = {
        currentCredential: accountForm.currentCredential.value,
        newEmail: accountForm.newEmail.value.trim(),
        newPassword: accountForm.newPassword.value,
        newPasscode: accountForm.newPasscode ? accountForm.newPasscode.value.trim() : '',
        removePasscode: accountForm.removePasscode ? accountForm.removePasscode.checked : false,
        requireBiometricSensitive: accountForm.requireBiometricSensitive ? accountForm.requireBiometricSensitive.checked : undefined,
      };

      const sensitiveToggleChanged = Boolean(
        accountForm.requireBiometricSensitive
        && (accountForm.requireBiometricSensitive.dataset.initialValue || '0') !== (accountForm.requireBiometricSensitive.checked ? '1' : '0')
      );

      if (!payload.currentCredential) {
        setMessage(msg, 'Current password or 4-digit passcode is required.', 'error');
        return;
      }

      if (!payload.newEmail && !payload.newPassword && !payload.newPasscode && !payload.removePasscode && !sensitiveToggleChanged) {
        setMessage(msg, 'No account settings were changed.', 'error');
        return;
      }

      if (payload.newPassword && payload.newPassword.length < 8) {
        setMessage(msg, 'New password must be at least 8 characters.', 'error');
        return;
      }

      if (payload.newPasscode && !/^\d{4}$/.test(payload.newPasscode)) {
        setMessage(msg, 'Passcode must be exactly 4 digits.', 'error');
        return;
      }

      const res = await apiFetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(msg, data.error || 'Failed to update admin account.', 'error');
        return;
      }

      const data = await res.json();
      const successText = data.email ? `Admin account updated. Current email: ${data.email}` : 'Admin account updated.';
      setMessage(msg, successText, 'success');

      if (!portalCurrentUser) portalCurrentUser = {};
      if (!portalCurrentUser.securityPreferences) portalCurrentUser.securityPreferences = {};
      const nextSensitive = data && data.securityPreferences && data.securityPreferences.requireBiometricSensitive === true;
      portalCurrentUser.securityPreferences.requireBiometricSensitive = nextSensitive;
      if (accountForm.requireBiometricSensitive) {
        accountForm.requireBiometricSensitive.dataset.initialValue = nextSensitive ? '1' : '0';
      }

      accountForm.currentCredential.value = '';
      accountForm.newPassword.value = '';
      if (accountForm.newPasscode) accountForm.newPasscode.value = '';
      if (accountForm.removePasscode) accountForm.removePasscode.checked = false;
      await refreshPasskeyStatus(accountForm).catch(() => {});
      await loadAdminDashboard(currentUser);
    });
  }
}

function bindAdminFilters() {
  const controls = [
    'adminUserSearch',
    'adminJobSearch',
    'adminJobStatusFilter',
    'adminEmployeeSearch',
  ];

  controls.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', renderAdminTables);
    el.addEventListener('change', renderAdminTables);
  });
}

function bindAdminContractDrawers() {
  const contractsSection = document.getElementById('adminContractsSection');
  const miscOnlySection = document.getElementById('adminMiscDocsSection');
  if (!contractsSection && !miscOnlySection) return;

  const bankBtn = document.getElementById('adminOpenContractsBankBtn');
  const allBtn = document.getElementById('adminOpenAllContractsBtn');
  const warehouseBtn = document.getElementById('adminOpenWarehouseContractsBtn');
  const healthcareBtn = document.getElementById('adminOpenHealthcareContractsBtn');
  const miscBtn = document.getElementById('adminOpenMiscDocsBtn');

  const bankTbody = document.getElementById('adminContractsBankTbody');
  const allTbody = document.getElementById('adminContractsAllTbody');
  const warehouseTbody = document.getElementById('adminContractsWarehouseTbody');
  const healthcareTbody = document.getElementById('adminContractsHealthcareTbody');
  const miscTbody = document.getElementById('adminMiscDocsTbody');

  const bankUploadForm = document.getElementById('adminContractsBankUploadForm');
  const bankUploadMessage = document.getElementById('adminContractsBankUploadMessage');
  const bankIndustrySelect = document.getElementById('adminContractsBankIndustry');
  const bankFileInput = document.getElementById('adminContractsBankFileInput');
  const bankChooseFilesBtn = document.getElementById('adminContractsBankChooseFilesBtn');
  const bankSaveBtn = document.getElementById('adminContractsBankSaveBtn');
  const bankFilesSummary = document.getElementById('adminContractsBankFilesSummary');
  const bankFilesList = document.getElementById('adminContractsBankFilesList');

  const miscUploadForm = document.getElementById('adminMiscDocsUploadForm');
  const miscUploadMessage = document.getElementById('adminMiscDocsUploadMessage');
  const miscDescriptionInput = document.getElementById('adminMiscDocsDescription');
  const miscFileInput = document.getElementById('adminMiscDocsFileInput');
  const miscChooseFilesBtn = document.getElementById('adminMiscDocsChooseFilesBtn');
  const miscSaveBtn = document.getElementById('adminMiscDocsSaveBtn');
  const miscFilesSummary = document.getElementById('adminMiscDocsFilesSummary');
  const miscFilesList = document.getElementById('adminMiscDocsFilesList');

  const warehouseForm = document.getElementById('adminContractsWarehouseForm');
  const healthcareForm = document.getElementById('adminContractsHealthcareForm');

  const warehouseMsg = document.getElementById('adminContractsWarehouseMessage');
  const healthcareMsg = document.getElementById('adminContractsHealthcareMessage');

  const warehouseFileInput = document.getElementById('adminContractsWarehouseFile');
  const healthcareFileInput = document.getElementById('adminContractsHealthcareFile');
  const warehouseSendBtn = document.getElementById('adminContractsWarehouseSendBtn');
  const healthcareSendBtn = document.getElementById('adminContractsHealthcareSendBtn');

  const reviewMsg = document.getElementById('adminContractReviewMessage');
  const reviewSignBtn = document.getElementById('adminContractSignBtn');
  const reviewSignatureInput = document.getElementById('adminContractSignature');
  const reviewAuthorizeInput = document.getElementById('adminContractAuthorize');

  const syncBankUploadUi = () => {
    const files = bankFileInput ? Array.from(bankFileInput.files || []) : [];
    const fileCount = files.length;
    const hasFiles = fileCount > 0;
    const hasTrack = Boolean(bankIndustrySelect && String(bankIndustrySelect.value || '').trim());

    if (bankSaveBtn) bankSaveBtn.disabled = !(hasFiles && hasTrack);
    if (bankFilesSummary) {
      bankFilesSummary.textContent = hasFiles
        ? `${fileCount} file${fileCount === 1 ? '' : 's'} selected.`
        : 'No files selected.';
    }

    if (bankFilesList) {
      const previewItems = files.slice(0, 8).map((file) => `<li>${escapeHtml(file.name || 'Contract.pdf')}</li>`).join('');
      const hiddenCount = fileCount > 8 ? fileCount - 8 : 0;
      bankFilesList.innerHTML = hiddenCount > 0
        ? `${previewItems}<li>+ ${hiddenCount} more</li>`
        : previewItems;
    }
  };

  const bindSendGate = (fileInput, sendBtn) => {
    if (!fileInput || !sendBtn || fileInput.dataset.sendGateBound === '1') return;

    const syncState = () => {
      const hasFile = Boolean(fileInput.files && fileInput.files.length > 0);
      sendBtn.disabled = !hasFile;
    };

    fileInput.dataset.sendGateBound = '1';
    fileInput.addEventListener('change', syncState);
    syncState();
  };

  bindSendGate(warehouseFileInput, warehouseSendBtn);
  bindSendGate(healthcareFileInput, healthcareSendBtn);

  const openContractSection = async (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    if (sectionId === 'adminContractsWarehouseSection') {
      populateContractClientSelect('adminContractsWarehouseClient', 'warehouse');
      adminState.contractsWarehouse = await loadAdminContracts('warehouse');
      renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse);
    }

    if (sectionId === 'adminContractsHealthcareSection') {
      populateContractClientSelect('adminContractsHealthcareClient', 'healthcare');
      adminState.contractsHealthcare = await loadAdminContracts('healthcare');
      renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
    }

    if (sectionId === 'adminContractsAllSection') {
      adminState.contractsAll = await loadAdminContracts();
      renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
    }

    if (sectionId === 'adminContractsBankSection') {
      adminState.contractsBank = await loadAdminContractsBank();
      renderAdminContractsBankTable(adminState.contractsBank);
      syncBankUploadUi();
    }

    if (sectionId === 'adminMiscDocsSection') {
      adminState.miscDocs = await loadAdminMiscDocs();
      renderAdminMiscDocsTable(adminState.miscDocs);
    }

    section.hidden = false;
    openPortalDrawerById(sectionId);
  };

  const handleContractUpload = async (form, messageEl, track) => {
    if (!form || !messageEl) return;
    hideMessage(messageEl);

    const formData = new FormData(form);
    formData.append('industryTrack', track);

    const res = await apiFetch('/api/admin/contracts', {
      method: 'POST',
      body: formData,
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(messageEl, payload.error || 'Failed to upload contract.', 'error');
      return;
    }

    const uploadedCount = Number(payload && payload.count);
    const successText = Number.isInteger(uploadedCount) && uploadedCount > 1
      ? `${uploadedCount} contracts uploaded and sent.`
      : 'Contract uploaded and sent.';
    setMessage(messageEl, successText, 'success');
    form.reset();
    if (track === 'warehouse') {
      adminState.contractsAll = await loadAdminContracts();
      adminState.contractsWarehouse = await loadAdminContracts('warehouse');
      renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
      renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse);
      if (warehouseSendBtn) warehouseSendBtn.disabled = true;
    } else {
      adminState.contractsAll = await loadAdminContracts();
      adminState.contractsHealthcare = await loadAdminContracts('healthcare');
      renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
      renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
      if (healthcareSendBtn) healthcareSendBtn.disabled = true;
    }
    adminState.contractsBank = await loadAdminContractsBank();
    renderAdminContractsBankTable(adminState.contractsBank);
  };

  const bindReviewTable = (tbody) => {
    if (!tbody || tbody.dataset.contractReviewBound === '1') return;
    tbody.dataset.contractReviewBound = '1';
    tbody.addEventListener('click', async (event) => {
      const reviewBtn = event.target.closest('[data-admin-contract-review-id]');
      if (!reviewBtn) return;
      const contractId = asInt(reviewBtn.dataset.adminContractReviewId);
      if (!Number.isInteger(contractId) || contractId < 1) return;

      const combined = [
        ...(adminState.contractsBank || []),
        ...(adminState.contractsAll || []),
        ...(adminState.contractsWarehouse || []),
        ...(adminState.contractsHealthcare || []),
      ];
      let contract = combined.find((item) => Number(item.id) === contractId);

      if (!contract) {
        const reload = await loadAdminContractsBank();
        contract = (reload || []).find((item) => Number(item.id) === contractId);
      }

      if (!contract) return;
      openAdminContractReview(contract);
    });
  };

  bindReviewTable(bankTbody);
  bindReviewTable(allTbody);
  bindReviewTable(warehouseTbody);
  bindReviewTable(healthcareTbody);

  if (bankUploadForm && bankUploadForm.dataset.contractUploadBound !== '1') {
    bankUploadForm.dataset.contractUploadBound = '1';

    if (bankChooseFilesBtn) {
      bankChooseFilesBtn.addEventListener('click', () => {
        if (bankFileInput) bankFileInput.click();
      });
    }

    if (bankFileInput) {
      bankFileInput.addEventListener('change', syncBankUploadUi);
    }

    if (bankIndustrySelect) {
      bankIndustrySelect.addEventListener('change', syncBankUploadUi);
    }

    bankUploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (bankUploadMessage) hideMessage(bankUploadMessage);

      const track = bankIndustrySelect ? String(bankIndustrySelect.value || '').trim() : '';
      const files = bankFileInput ? Array.from(bankFileInput.files || []) : [];

      if (!track || files.length < 1) {
        if (bankUploadMessage) setMessage(bankUploadMessage, 'Select industry track and at least one file.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('industryTrack', track);
      files.forEach((file) => {
        formData.append('contract', file, file.name);
      });

      const res = await apiFetch('/api/admin/contract-bank', {
        method: 'POST',
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (bankUploadMessage) setMessage(bankUploadMessage, payload.error || 'Failed to save contracts.', 'error');
        return;
      }

      const savedCount = Number(payload && payload.count);
      const successText = Number.isInteger(savedCount) && savedCount > 1
        ? `${savedCount} contracts saved to the bank.`
        : 'Contract saved to the bank.';
      if (bankUploadMessage) setMessage(bankUploadMessage, successText, 'success');

      if (bankFileInput) bankFileInput.value = '';
      if (bankUploadForm) bankUploadForm.reset();
      syncBankUploadUi();

      adminState.contractsBank = await loadAdminContractsBank();
      renderAdminContractsBankTable(adminState.contractsBank);
    });

    syncBankUploadUi();
  }

  // ── Delete button in bank table ──────────────────────────────────────────
  if (bankTbody && bankTbody.dataset.deleteBankBound !== '1') {
    bankTbody.dataset.deleteBankBound = '1';
    bankTbody.addEventListener('click', async (event) => {
      const deleteBtn = event.target.closest('[data-delete-bank-id]');
      if (!deleteBtn) return;
      const bankId = asInt(deleteBtn.dataset.deleteBankId);
      if (!Number.isInteger(bankId) || bankId < 1) return;
      if (!confirm('Delete this contract from the bank? This cannot be undone.')) return;
      const res = await apiFetch(`/api/admin/contract-bank/${bankId}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (bankUploadMessage) setMessage(bankUploadMessage, payload.error || 'Failed to delete contract.', 'error');
        return;
      }
      adminState.contractsBank = await loadAdminContractsBank();
      renderAdminContractsBankTable(adminState.contractsBank);
    });
  }

  if (warehouseForm && warehouseForm.dataset.contractUploadBound !== '1') {
    warehouseForm.dataset.contractUploadBound = '1';
    warehouseForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await handleContractUpload(warehouseForm, warehouseMsg, 'warehouse');
    });
  }

  if (healthcareForm && healthcareForm.dataset.contractUploadBound !== '1') {
    healthcareForm.dataset.contractUploadBound = '1';
    healthcareForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await handleContractUpload(healthcareForm, healthcareMsg, 'healthcare');
    });
  }

  if (reviewSignBtn && reviewSignBtn.dataset.bound !== '1') {
    reviewSignBtn.dataset.bound = '1';

    const trackSaveBtn = document.getElementById('adminContractIndustryTrackSaveBtn');
    const trackSelect = document.getElementById('adminContractIndustryTrack');
    if (trackSaveBtn && trackSaveBtn.dataset.bound !== '1') {
      trackSaveBtn.dataset.bound = '1';
      trackSaveBtn.addEventListener('click', async () => {
        if (reviewMsg) hideMessage(reviewMsg);
        const contractId = asInt(trackSaveBtn.dataset.contractId);
        if (!Number.isInteger(contractId) || contractId < 1) return;
        const track = trackSelect ? String(trackSelect.value || '').trim() : '';
        if (!track) return;
        trackSaveBtn.disabled = true;
        const prev = trackSaveBtn.textContent;
        trackSaveBtn.textContent = 'Saving...';
        try {
          const res = await apiFetch(`/api/admin/contracts/${contractId}/industry-track`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ industryTrack: track }),
          });
          const payload = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (reviewMsg) setMessage(reviewMsg, payload.error || 'Failed to update industry track.', 'error');
            return;
          }
          if (reviewMsg) setMessage(reviewMsg, `Contract moved to ${track === 'healthcare' ? 'Healthcare' : 'Warehouse'} Industries.`, 'success');
          adminState.contractsAll = await loadAdminContracts();
          adminState.contractsWarehouse = await loadAdminContracts('warehouse');
          adminState.contractsHealthcare = await loadAdminContracts('healthcare');
          renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
          renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse);
          renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
        } finally {
          trackSaveBtn.disabled = false;
          trackSaveBtn.textContent = prev;
        }
      });
    }

    reviewSignBtn.addEventListener('click', async () => {
      if (reviewMsg) hideMessage(reviewMsg);
      const contractId = asInt(reviewSignBtn.dataset.contractId);
      if (!Number.isInteger(contractId) || contractId < 1) return;

      const res = await apiFetch(`/api/admin/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureName: reviewSignatureInput ? String(reviewSignatureInput.value || '').trim() : '',
          authorized: Boolean(reviewAuthorizeInput && reviewAuthorizeInput.checked),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (reviewMsg) setMessage(reviewMsg, payload.error || 'Failed to sign contract.', 'error');
        return;
      }

      if (reviewMsg) setMessage(reviewMsg, 'Contract executed successfully.', 'success');
      adminState.contractsAll = await loadAdminContracts();
      adminState.contractsWarehouse = await loadAdminContracts('warehouse');
      adminState.contractsHealthcare = await loadAdminContracts('healthcare');
      adminState.contractsBank = await loadAdminContractsBank();
      renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
      renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse);
      renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
      renderAdminContractsBankTable(adminState.contractsBank);
    });
  }

  // Admin: delete contract button
      const deleteContractBtn = document.getElementById('adminContractDeleteBtn');
      if (deleteContractBtn && deleteContractBtn.dataset.bound !== '1') {
        deleteContractBtn.dataset.bound = '1';
        deleteContractBtn.addEventListener('click', async () => {
          const contractId = asInt(deleteContractBtn.dataset.contractId);
          if (!Number.isInteger(contractId) || contractId < 1) return;
          if (!window.confirm('Delete this contract? This cannot be undone.')) return;
          const res = await apiFetch(`/api/admin/contracts/${contractId}`, { method: 'DELETE' });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { if (reviewMsg) setMessage(reviewMsg, data.error || 'Failed to delete.', 'error'); return; }
          if (reviewMsg) setMessage(reviewMsg, 'Contract deleted.', 'success');
          adminState.contractsAll = await loadAdminContracts();
          adminState.contractsWarehouse = await loadAdminContracts('warehouse');
          adminState.contractsHealthcare = await loadAdminContracts('healthcare');
          renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
          renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse);
          renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
        });
      }

      // Admin: confirm contract cancellation
      const cancelConfirmBtn = document.getElementById('adminContractCancelConfirmBtn');
      const cancelMsg_ = document.getElementById('adminContractCancelMessage');
      if (cancelConfirmBtn && cancelConfirmBtn.dataset.bound !== '1') {
        cancelConfirmBtn.dataset.bound = '1';
        cancelConfirmBtn.addEventListener('click', async () => {
          const contractId = asInt(cancelConfirmBtn.dataset.contractId);
          if (!Number.isInteger(contractId) || contractId < 1) return;
          const sigInput = document.getElementById('adminContractCancelSignature');
          const signature = sigInput ? sigInput.value.trim() : '';
          if (!signature) { if (cancelMsg_) setMessage(cancelMsg_, 'Your electronic signature is required.', 'error'); return; }
          if (!window.confirm('This will permanently cancel the contract. Both parties must consent to this action. Confirm?')) return;
          cancelConfirmBtn.disabled = true;
          const res = await apiFetch(`/api/admin/contracts/${contractId}/confirm-cancellation`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signatureName: signature }),
          });
          cancelConfirmBtn.disabled = false;
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { if (cancelMsg_) setMessage(cancelMsg_, data.error || 'Failed.', 'error'); return; }
          if (cancelMsg_) setMessage(cancelMsg_, 'Contract has been permanently cancelled. Both parties have been notified.', 'success');
          adminState.contractsAll = await loadAdminContracts();
          adminState.contractsWarehouse = await loadAdminContracts('warehouse');
          adminState.contractsHealthcare = await loadAdminContracts('healthcare');
          renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll);
          renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse);
          renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
        });
      }

      // Admin: renewal decision buttons
      const adminRenewBtn = document.getElementById('adminContractRenewBtn');
      const adminDenyRenewalBtn = document.getElementById('adminContractDenyRenewalBtn');
      const adminRenewalMsg = document.getElementById('adminContractRenewalMessage');
      const adminRenewalSigRow = document.getElementById('adminRenewalSignatureRow');
      if (adminRenewBtn && adminRenewBtn.dataset.bound !== '1') {
        adminRenewBtn.dataset.bound = '1';
        adminRenewBtn.addEventListener('click', () => { if (adminRenewalSigRow) adminRenewalSigRow.style.display = ''; });
        const confirmRenewAdmin = document.createElement('button');
        confirmRenewAdmin.className = 'button button--sm';
        confirmRenewAdmin.type = 'button';
        confirmRenewAdmin.textContent = 'Confirm Renewal';
        confirmRenewAdmin.style.marginTop = '0.5rem';
        if (adminRenewalSigRow && !adminRenewalSigRow.querySelector('[data-admin-confirm-renew]')) {
          confirmRenewAdmin.dataset.adminConfirmRenew = '1';
          adminRenewalSigRow.appendChild(confirmRenewAdmin);
          confirmRenewAdmin.addEventListener('click', async () => {
            const contractId = asInt(adminRenewBtn.dataset.contractId);
            if (!Number.isInteger(contractId) || contractId < 1) return;
            const sig = (document.getElementById('adminContractRenewalSignature') || {}).value?.trim() || '';
            if (!sig) { if (adminRenewalMsg) setMessage(adminRenewalMsg, 'Your electronic signature is required.', 'error'); return; }
            confirmRenewAdmin.disabled = true;
            const res = await apiFetch(`/api/admin/contracts/${contractId}/renewal-decision`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ decision: 'renew', signatureName: sig }),
            });
            confirmRenewAdmin.disabled = false;
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { if (adminRenewalMsg) setMessage(adminRenewalMsg, data.error || 'Failed.', 'error'); return; }
            if (adminRenewalMsg) setMessage(adminRenewalMsg, 'Renewal decision recorded.', 'success');
            adminState.contractsAll = await loadAdminContracts(); adminState.contractsWarehouse = await loadAdminContracts('warehouse'); adminState.contractsHealthcare = await loadAdminContracts('healthcare');
            renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll); renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse); renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
          });
        }
      }
      if (adminDenyRenewalBtn && adminDenyRenewalBtn.dataset.bound !== '1') {
        adminDenyRenewalBtn.dataset.bound = '1';
        adminDenyRenewalBtn.addEventListener('click', async () => {
          const contractId = asInt(adminDenyRenewalBtn.dataset.contractId);
          if (!Number.isInteger(contractId) || contractId < 1) return;
          if (!window.confirm('Deny this contract renewal? The contract will expire.')) return;
          adminDenyRenewalBtn.disabled = true;
          const res = await apiFetch(`/api/admin/contracts/${contractId}/renewal-decision`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision: 'deny' }),
          });
          adminDenyRenewalBtn.disabled = false;
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { if (adminRenewalMsg) setMessage(adminRenewalMsg, data.error || 'Failed.', 'error'); return; }
          if (adminRenewalMsg) setMessage(adminRenewalMsg, 'Renewal denied. Contract has expired.', 'success');
          adminState.contractsAll = await loadAdminContracts(); adminState.contractsWarehouse = await loadAdminContracts('warehouse'); adminState.contractsHealthcare = await loadAdminContracts('healthcare');
          renderAdminContractsTable('adminContractsAllTbody', adminState.contractsAll); renderAdminContractsTable('adminContractsWarehouseTbody', adminState.contractsWarehouse); renderAdminContractsTable('adminContractsHealthcareTbody', adminState.contractsHealthcare);
        });
      }

      if (bankBtn && bankBtn.dataset.bound !== '1') {
    bankBtn.dataset.bound = '1';
    bankBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      await openContractSection('adminContractsBankSection');
    });
  }

  if (allBtn && allBtn.dataset.bound !== '1') {
    allBtn.dataset.bound = '1';
    allBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      await openContractSection('adminContractsAllSection');
    });
  }

  if (warehouseBtn && warehouseBtn.dataset.bound !== '1') {
    warehouseBtn.dataset.bound = '1';
    warehouseBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      await openContractSection('adminContractsWarehouseSection');
    });
  }

  if (healthcareBtn && healthcareBtn.dataset.bound !== '1') {
    healthcareBtn.dataset.bound = '1';
    healthcareBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      await openContractSection('adminContractsHealthcareSection');
    });
  }

  if (miscBtn && miscBtn.dataset.bound !== '1') {
    miscBtn.dataset.bound = '1';
    miscBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      await openContractSection('adminMiscDocsSection');
    });
  }

  if (miscUploadForm && miscUploadForm.dataset.miscUploadBound !== '1') {
    miscUploadForm.dataset.miscUploadBound = '1';

    const syncMiscUploadUi = () => {
      const files = miscFileInput ? Array.from(miscFileInput.files || []) : [];
      const fileCount = files.length;
      const hasFiles = fileCount > 0;
      if (miscSaveBtn) miscSaveBtn.disabled = !hasFiles;
      if (miscFilesSummary) {
        miscFilesSummary.textContent = hasFiles
          ? `${fileCount} file${fileCount === 1 ? '' : 's'} selected.`
          : 'No files selected.';
      }
      if (miscFilesList) {
        const previewItems = files.slice(0, 8).map((file) => `<li>${escapeHtml(file.name || 'document')}</li>`).join('');
        const hiddenCount = fileCount > 8 ? fileCount - 8 : 0;
        miscFilesList.innerHTML = hiddenCount > 0
          ? `${previewItems}<li>+ ${hiddenCount} more</li>`
          : previewItems;
      }
    };

    if (miscChooseFilesBtn) {
      miscChooseFilesBtn.addEventListener('click', () => {
        if (miscFileInput) miscFileInput.click();
      });
    }

    if (miscFileInput) {
      miscFileInput.addEventListener('change', syncMiscUploadUi);
    }

    miscUploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (miscUploadMessage) hideMessage(miscUploadMessage);

      const files = miscFileInput ? Array.from(miscFileInput.files || []) : [];
      if (!files.length) {
        if (miscUploadMessage) setMessage(miscUploadMessage, 'Select at least one file.', 'error');
        return;
      }

      const formData = new FormData();
      const description = miscDescriptionInput ? String(miscDescriptionInput.value || '').trim() : '';
      if (description) formData.append('description', description);
      files.forEach((file) => formData.append('document', file, file.name));

      const res = await apiFetch('/api/admin/misc-docs', { method: 'POST', body: formData });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (miscUploadMessage) setMessage(miscUploadMessage, payload.error || 'Failed to save documents.', 'error');
        return;
      }

      const savedCount = Number(payload && payload.count);
      const successText = Number.isInteger(savedCount) && savedCount > 1
        ? `${savedCount} documents saved.`
        : 'Document saved.';
      if (miscUploadMessage) setMessage(miscUploadMessage, successText, 'success');

      if (miscFileInput) miscFileInput.value = '';
      miscUploadForm.reset();
      syncMiscUploadUi();

      adminState.miscDocs = await loadAdminMiscDocs();
      renderAdminMiscDocsTable(adminState.miscDocs);
    });

    syncMiscUploadUi();
  }

  if (miscTbody && miscTbody.dataset.deleteMiscBound !== '1') {
    miscTbody.dataset.deleteMiscBound = '1';
    miscTbody.addEventListener('click', async (event) => {
      const deleteBtn = event.target.closest('[data-delete-misc-id]');
      if (!deleteBtn) return;
      const docId = asInt(deleteBtn.dataset.deleteMiscId);
      if (!Number.isInteger(docId) || docId < 1) return;
      if (!confirm('Delete this document? This cannot be undone.')) return;
      const res = await apiFetch(`/api/admin/misc-docs/${docId}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (miscUploadMessage) setMessage(miscUploadMessage, payload.error || 'Failed to delete document.', 'error');
        return;
      }
      adminState.miscDocs = await loadAdminMiscDocs();
      renderAdminMiscDocsTable(adminState.miscDocs);
    });
  }

  // ── Misc docs send panel ────────────────────────────────────────────────
  const miscSendPanel = document.getElementById('adminMiscDocsSendPanel');
  const miscSendName = document.getElementById('adminMiscDocsSendName');
  const miscSendCloseBtn = document.getElementById('adminMiscDocsSendCloseBtn');
  const miscSendEmployeeSelect = document.getElementById('adminMiscDocsSendEmployee');
  const miscSendSubmitBtn = document.getElementById('adminMiscDocsSendSubmitBtn');
  const miscSendMessage = document.getElementById('adminMiscDocsSendMessage');

  if (miscSendPanel && miscTbody && miscTbody.dataset.sendMiscBound !== '1') {
    miscTbody.dataset.sendMiscBound = '1';
    miscTbody.addEventListener('click', async (event) => {
      const sendBtn = event.target.closest('[data-send-misc-id]');
      if (!sendBtn) return;
      const docId = sendBtn.dataset.sendMiscId;
      const docName = sendBtn.dataset.sendMiscName || 'Document';

      try {
        const recipients = await loadMiscDocRecipients(true);

        // Populate employee select
        if (miscSendEmployeeSelect) {
          const empOptions = (recipients.employees || [])
            .map((e) => {
              const name = e.name || e.email || String(e.id);
              const label = e.isActive === 0 || e.isActive === false ? `${name} (Pending activation)` : name;
              return `<option value="${escapeHtml(String(e.id))}">${escapeHtml(label)}</option>`;
            })
            .join('');
          miscSendEmployeeSelect.innerHTML = '<option value="">\u2014 Select employee \u2014</option>' + empOptions;
        }

        if (miscSendName) miscSendName.textContent = docName;
        if (miscSendMessage) hideMessage(miscSendMessage);
        miscSendPanel.dataset.miscId = docId;
        miscSendPanel.hidden = false;
      } catch (_error) {
        if (miscSendMessage) setMessage(miscSendMessage, 'Unable to load recipients right now. Please try again.', 'error');
      }
    });
  }

  if (miscSendCloseBtn && miscSendCloseBtn.dataset.bound !== '1') {
    miscSendCloseBtn.dataset.bound = '1';
    miscSendCloseBtn.addEventListener('click', () => {
      if (miscSendPanel) miscSendPanel.hidden = true;
    });
  }

  if (miscSendSubmitBtn && miscSendSubmitBtn.dataset.bound !== '1') {
    miscSendSubmitBtn.dataset.bound = '1';
    miscSendSubmitBtn.addEventListener('click', async () => {
      if (!miscSendPanel) {
        if (miscSendMessage) setMessage(miscSendMessage, 'Send panel is not available.', 'error');
        return;
      }

      const docId = asInt(miscSendPanel.dataset.miscId);
      if (!Number.isInteger(docId) || docId < 1) {
        if (miscSendMessage) setMessage(miscSendMessage, 'Select a document to send first.', 'error');
        return;
      }

      const employeeUserId = miscSendEmployeeSelect ? (asInt(miscSendEmployeeSelect.value) || null) : null;
      if (!employeeUserId) {
        if (miscSendMessage) setMessage(miscSendMessage, 'Select an employee recipient.', 'error');
        return;
      }

      miscSendSubmitBtn.disabled = true;
      try {
        const res = await apiFetch(`/api/admin/misc-docs/${docId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeUserId }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (miscSendMessage) setMessage(miscSendMessage, payload.error || 'Failed to send document.', 'error');
          return;
        }
        if (miscSendMessage) setMessage(miscSendMessage, 'Document sent successfully.', 'success');
        setTimeout(() => { if (miscSendPanel) miscSendPanel.hidden = true; }, 1500);
      } catch (_error) {
        if (miscSendMessage) setMessage(miscSendMessage, 'Unable to send right now. Please check your connection and try again.', 'error');
      } finally {
        miscSendSubmitBtn.disabled = false;
      }
    });
  }
}

async function initPortalPage() {
  bindAuthEntryForms();

  const logoutBtn = document.getElementById('portalLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  try {
    bindPasswordVisibilityToggles();
  } catch (_error) {
    // Ignore non-critical UI enhancement failures.
  }

  try {
    document.querySelectorAll('input[type="tel"]').forEach((input) => bindPhoneMask(input));
  } catch (_error) {
    // Ignore non-critical UI enhancement failures.
  }

  const loginForm = document.getElementById('portalLoginForm');
  if (loginForm) {
    bindPasskeyLoginButton(loginForm);

    const params = new URLSearchParams(window.location.search);
    const prefillEmail = params.get('email');
    if (prefillEmail && loginForm.email) {
      loginForm.email.value = prefillEmail;
    }

    const applied = params.get('applied');
    const withdrawn = params.get('withdrawn');
    const reason = params.get('reason');
    const verificationPending = params.get('verificationPending');
    const resentVerification = params.get('resentVerification');
    if (applied === '1') {
      const loginMsg = document.getElementById('portalLoginMessage');
      setMessage(loginMsg, 'Application received. Sign in to view it in your portal.', 'success');
    }

    if (withdrawn === '1') {
      const loginMsg = document.getElementById('portalLoginMessage');
      setMessage(loginMsg, 'Profile withdrawn successfully.', 'success');
    }

    if (reason === 'session_expired') {
      const loginMsg = document.getElementById('portalLoginMessage');
      setMessage(loginMsg, 'Your session has expired. Please sign in again.', 'error');
    }

    if (verificationPending === '1') {
      const loginMsg = document.getElementById('portalLoginMessage');
      setMessage(
        loginMsg,
        resentVerification === '1'
          ? 'Verification email sent again. Check your inbox before signing in.'
          : 'Account created. Check your inbox for the verification email before signing in.',
        'success'
      );
    }

    const user = await loadCurrentUser({ cookieOnly: true });
    if (user) {
      const redirectTarget = getPortalRedirectTargetFromUrl();
      window.location.href = redirectTarget || (user && user.homePath ? user.homePath : routeForRole(user.role, user.portalScope));
    }

    // Handle ?resetToken= in URL — show the reset password form
    const resetToken = params.get('resetToken');
    if (resetToken) {
      const loginFormEl = document.getElementById('portalLoginForm');
      const resetSection = document.getElementById('resetPasswordSection');
      const resetTokenField = document.getElementById('resetToken');
      if (loginFormEl) loginFormEl.hidden = true;
      if (resetSection) resetSection.hidden = false;
      if (resetTokenField) resetTokenField.value = resetToken;
    }

    // Forgot password toggle
    const showForgotLink = document.getElementById('showForgotPasswordLink');
    const forgotSection = document.getElementById('forgotPasswordSection');
    const cancelForgotBtn = document.getElementById('cancelForgotPasswordBtn');
    const forgotForm = document.getElementById('forgotPasswordForm');
    const resetForm = document.getElementById('resetPasswordForm');
    const loginFormMain = document.getElementById('portalLoginForm');

    if (showForgotLink && forgotSection) {
      showForgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginFormMain) loginFormMain.hidden = true;
        forgotSection.hidden = false;
        const forgotInput = document.getElementById('forgotIdentifier');
        if (forgotInput) forgotInput.focus();
      });
    }

    if (cancelForgotBtn && forgotSection) {
      cancelForgotBtn.addEventListener('click', () => {
        forgotSection.hidden = true;
        if (loginFormMain) loginFormMain.hidden = false;
      });
    }

    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('forgotPasswordMessage');
        const identifier = String(forgotForm.identifier ? forgotForm.identifier.value : '').trim();
        const btn = forgotForm.querySelector('[type="submit"]');
        if (!identifier) {
          setMessage(msg, 'Please enter your email or phone number.', 'error');
          return;
        }
        if (btn) btn.disabled = true;
        setMessage(msg, 'Sending reset link...', 'neutral');
        try {
          const res = await apiFetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier }),
            _skipAuthRedirect: true,
          });
          const payload = await res.json().catch(() => ({}));
          if (!res.ok) {
            setMessage(msg, payload.error || 'Unable to send reset link. Please try again.', 'error');
          } else {
            setMessage(msg, payload.message || 'If an account was found, a reset link has been sent.', 'success');
            forgotForm.reset();
          }
        } catch (_err) {
          setMessage(msg, 'Unable to send reset link. Please check your connection and try again.', 'error');
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }

    if (resetForm) {
      resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('resetPasswordMessage');
        const tokenField = document.getElementById('resetToken');
        const resetToken = String(tokenField ? tokenField.value : '').trim();
        const newPassword = String(resetForm.newPassword ? resetForm.newPassword.value : '');
        const confirmPassword = String(resetForm.confirmPassword ? resetForm.confirmPassword.value : '');
        const btn = resetForm.querySelector('[type="submit"]');
        if (newPassword.length < 8) {
          setMessage(msg, 'Password must be at least 8 characters.', 'error');
          return;
        }
        if (newPassword !== confirmPassword) {
          setMessage(msg, 'Passwords do not match.', 'error');
          return;
        }
        if (btn) btn.disabled = true;
        setMessage(msg, 'Updating password...', 'neutral');
        try {
          console.info('[reset-password] submit started', {
            hasToken: Boolean(resetToken),
            tokenPreview: resetToken ? `${resetToken.slice(0, 8)}...` : null,
            passwordLength: newPassword.length,
          });
          const res = await apiFetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: resetToken, newPassword }),
            _skipAuthRedirect: true,
          });
          const payload = await res.json().catch(() => ({}));
          console.info('[reset-password] submit response', {
            status: res.status,
            ok: res.ok,
            payload,
          });
          if (!res.ok) {
            setMessage(msg, payload.error || 'Unable to reset password. The link may have expired.', 'error');
          } else {
            setMessage(msg, 'Password updated successfully! Redirecting to sign in...', 'success');
            setTimeout(() => { window.location.href = '/portal-login'; }, 2000);
          }
        } catch (error) {
          console.error('[reset-password] submit failed', {
            message: error && error.message ? error.message : String(error),
            hasToken: Boolean(resetToken),
            tokenPreview: resetToken ? `${resetToken.slice(0, 8)}...` : null,
          });
          setMessage(msg, 'Unable to reset password. Please check your connection and try again.', 'error');
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }

    return;
  }

  const registerForm = document.getElementById('portalRegisterForm');
  if (registerForm) {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    const name = params.get('name');
    const email = params.get('email');
    const phone = params.get('phone');
    const address = params.get('address');
    const city = params.get('city');
    const state = params.get('state');
    const zip = params.get('zip');
    const industry = params.get('industry');
    const position = params.get('position');
    const applied = params.get('applied');

    const roleField = document.getElementById('registerRole');
    bindZipAutofill(registerForm.zip, registerForm.city, registerForm.state);

    if (role && roleField) roleField.value = role;
    if (name && registerForm.name) registerForm.name.value = name;
    if (email && registerForm.email) registerForm.email.value = email;
    if (phone && registerForm.phone) registerForm.phone.value = phone;
    if (address && registerForm.address) registerForm.address.value = address;
    if (city && registerForm.city) registerForm.city.value = city;
    if (state && registerForm.state) registerForm.state.value = state;
    if (zip && registerForm.zip) registerForm.zip.value = zip;
    bindEmployeeRegistrationSelectors(registerForm, industry || '', position || '');
    configureEmployeeRegistrationFromApplication(registerForm, params);

    if (roleField) {
      const roleTiles = registerForm.querySelectorAll('[data-role-choice]');
      roleTiles.forEach((tile) => {
        tile.addEventListener('click', () => {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set('role', tile.dataset.roleChoice || '');
          window.location.href = nextUrl.toString();
        });
      });

      toggleRegisterRoleFields(roleField.value, Boolean(roleField.value));
    }

    if (applied === '1') {
      const registerMsg = document.getElementById('portalRegisterMessage');
      setMessage(registerMsg, 'Application received. Create your employee portal account to continue.', 'success');
    }

    const user = await loadCurrentUser({ cookieOnly: true });
    if (user) {
      window.location.href = user && user.homePath ? user.homePath : routeForRole(user.role, user.portalScope);
    }
    return;
  }

  const pageType = document.body.dataset.portalPage;
  if (!pageType) return;

  const user = await loadCurrentUser();
  if (!user) {
    portalCurrentUser = null;
    clearToken();
    window.location.href = buildPortalLoginRedirectPath(getCurrentPortalRelativeUrl());
    return;
  }
  portalCurrentUserId = Number(user.id) || null;
  portalCurrentUser = user;
  setPortalDocumentLanguage(isEmployeePortalPage() ? (user.preferredLanguage || PORTAL_DEFAULT_LANGUAGE) : PORTAL_DEFAULT_LANGUAGE);
  bindPortalThemeToggle();
  populateAccountIdentityFields(user);
  applyPortalStaticTranslations();
  bindPortalLanguageSelector();

  if (pageType === 'employee') {
    bindPortalMessaging();
    bindPortalNotifications();
    bindPortalAccountForm();
    bindEmployeeForms(user);
    await loadEmployeePortalData(user);
    await loadPortalNotifications();
    showSmtpStatusWarningIfNeeded();
    await bindNotificationControls();
    await handleEmployeeNotificationIntent(user);
    startPortalRealtimeSync(user);
    await handlePortalNotificationIntent(user);
    setupPortalWidgetLayout(pageType);
    return;
  }

  if (pageType === 'jobsite') {
    bindPortalMessaging();
    bindPortalNotifications();
    bindPortalAccountForm();
    bindJobsiteForms(user);
    await loadJobsiteDashboard(user);
    await loadPortalMessages();
    await loadPortalNotifications();
    showSmtpStatusWarningIfNeeded();
    await bindNotificationControls();
    startPortalRealtimeSync(user);
    await handlePortalNotificationIntent(user);
    setupPortalWidgetLayout(pageType);
    return;
  }

  if (pageType === 'admin') {
    bindPortalMessaging();
    bindPortalNotifications();
    bindAdminForms(user);
    bindAdminFilters();
    bindAdminContractDrawers();
    await loadAdminDashboard(user);
    await loadPortalMessages();
    await loadPortalNotifications();
    showSmtpStatusWarningIfNeeded();
    await bindNotificationControls();
    startPortalRealtimeSync(user);
    await handlePortalNotificationIntent(user);
    setupPortalWidgetLayout(pageType);
    return;
  }

  if (pageType === 'scheduling') {
    bindPortalMessaging();
    bindPortalNotifications();
    bindPortalAccountForm();
    bindSchedulingPortalForms(user);
    bindSchedulingReminderDiagnosticsForm();
    await loadSchedulingPortalData(user);
    await loadPortalMessages();
    await loadPortalNotifications();
    showSmtpStatusWarningIfNeeded();
    await bindNotificationControls();
    startPortalRealtimeSync(user);
    await handlePortalNotificationIntent(user);
    setupPortalWidgetLayout(pageType);
    return;
  }

  if (pageType === 'onboarding') {
    bindPortalMessaging();
    bindPortalNotifications();
    bindPortalAccountForm();
    bindAdminForms(user);
    bindAdminFilters();
    bindAdminContractDrawers();
    await loadOnboardingPortalData(user);
    await loadPortalMessages();
    await loadPortalNotifications();
    showSmtpStatusWarningIfNeeded();
    await bindNotificationControls();
    startPortalRealtimeSync(user);
    await handlePortalNotificationIntent(user);
    bindOnboardingDrawerTiles();
    return;
  }

  if (pageType === 'contracts') {
    bindPortalMessaging();
    bindPortalNotifications();
    bindPortalAccountForm();
    bindAdminContractDrawers();
    bindContractsPortalForms(user);
    await loadContractsPortalData(user);
    await loadPortalMessages();
    await loadPortalNotifications();
    showSmtpStatusWarningIfNeeded();
    await bindNotificationControls();
    startPortalRealtimeSync(user);
    await handlePortalNotificationIntent(user);
    setupPortalWidgetLayout(pageType);
  }
}

initPortalPage().catch((error) => {
  // Avoid redirect loops if a network/auth request fails during page init.
  clearToken();
  console.error('Portal init failed:', error);

  const loginMsg = document.getElementById('portalLoginMessage');
  const registerMsg = document.getElementById('portalRegisterMessage');
  if (loginMsg || registerMsg) {
    return;
  }

  const msg = document.getElementById('portalLoginMessage') || document.getElementById('portalRegisterMessage');
  if (msg) {
    setMessage(msg, 'Portal temporarily unavailable. Please refresh and try again.', 'error');
  }
});

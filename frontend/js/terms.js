class TermsManager {
    constructor() {
        this.termsContent = document.getElementById('termsContent');
        this.init();
    }

    async init() {
        await this.loadTermsContent();
        this.setupPrintButton();
    }

    async loadTermsContent() {
        try {
            // Mostrar loading
            this.showLoading();

            await this.simulateContentLoad();
            

        } catch (error) {
            console.error('Error cargando términos:', error);
            this.showError();
        }
    }

    async simulateContentLoad() {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const termsHTML = `
            <section class="terms-section">
                <h2>1. Aceptación de los Términos</h2>
                <p>Al registrarte y utilizar TheHeartCloud, aceptas cumplir con estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestros servicios.</p>
            </section>

            <section class="terms-section">
                <h2>2. Descripción del Servicio</h2>
                <p>TheHeartCloud es una plataforma comunitaria educativa diseñada para facilitar el intercambio de información y experiencias entre usuarios. El servicio incluye:</p>
                <ul>
                    <li>Foros de discusión temáticos</li>
                    <li>Publicación de contenido educativo</li>
                    <li>Sistema de comentarios y interacciones</li>
                    <li>Recursos comunitarios</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>3. Registro y Cuenta</h2>
                <h3>3.1 Requisitos de Registro</h3>
                <p>Para registrarte en TheHeartCloud debes:</p>
                <ul>
                    <li>Ser mayor de 13 años</li>
                    <li>Proporcionar información veraz y completa</li>
                    <li>Crear un nombre de usuario único (5-15 caracteres alfanuméricos)</li>
                    <li>Usar una contraseña segura (8-16 caracteres sin espacios)</li>
                    <li>Aceptar estos términos y condiciones</li>
                </ul>

                <h3>3.2 Responsabilidad de la Cuenta</h3>
                <p>Eres responsable de:</p>
                <ul>
                    <li>Mantener la confidencialidad de tu contraseña</li>
                    <li>Toda actividad que ocurra bajo tu cuenta</li>
                    <li>Notificarnos inmediatamente sobre uso no autorizado</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>4. Responsabilidad Médica - AVISO IMPORTANTE</h2>
                <div class="medical-warning">
                    <p><strong>AVISO CRÍTICO:</strong> TheHeartCloud es una plataforma <strong>COMUNITARIA y EDUCATIVA</strong>. La información compartida por los usuarios:</p>
                    <ul>
                        <li><strong>NO sustituye</strong> el consejo, diagnóstico o tratamiento médico profesional</li>
                        <li><strong>NO constituye</strong> relación médico-paciente</li>
                        <strong>NO debe usarse</strong> para emergencias médicas</li>
                    </ul>
                    <p>SIEMPRE consulta con profesionales de la salud certificados para decisiones médicas.</p>
                </div>
            </section>

            <section class="terms-section">
                <h2>5. Conducta del Usuario</h2>
                <h3>5.1 Contenido Prohibido</h3>
                <p>No puedes publicar contenido que:</p>
                <ul>
                    <li>Sea difamatorio, obsceno o ilegal</li>
                    <li>Infrinja derechos de propiedad intelectual</li>
                    <li>Contenga información médica no verificada</li>
                    <li>Promueva tratamientos no aprobados</li>
                    <li>Suplante la identidad de profesionales de la salud</li>
                </ul>

                <h3>5.2 Uso Apropiado</h3>
                <p>Debes utilizar la plataforma para:</p>
                <ul>
                    <li>Compartir experiencias personales de manera responsable</li>
                    <li>Brindar apoyo comunitario</li>
                    <li>Acceder a recursos educativos</li>
                    <li>Participar en discusiones respetuosas</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>6. Propiedad Intelectual</h2>
                <p>Al publicar contenido en TheHeartCloud:</p>
                <ul>
                    <li>Conservas los derechos de tu contenido</li>
                    <li>Nos otorgas licencia para mostrar y distribuir tu contenido en la plataforma</li>
                    <li>Aceptas que otros usuarios puedan ver y comentar tu contenido</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>7. Privacidad y Datos</h2>
                <p>Nos comprometemos a proteger tu privacidad:</p>
                <ul>
                    <li>Tu información personal se almacena de forma segura</li>
                    <li>Usamos encriptación para contraseñas y datos sensibles</li>
                    <li>No compartimos tu información con terceros sin consentimiento</li>
                    <li>Puedes solicitar la eliminación de tu cuenta en cualquier momento</li>
                </ul>
                <p>Consulta nuestra <a href="#" class="inline-link">Política de Privacidad</a> completa para más detalles.</p>
            </section>

            <section class="terms-section">
                <h2>8. Limitación de Responsabilidad</h2>
                <p>TheHeartCloud no será responsable por:</p>
                <ul>
                    <li>Decisiones médicas basadas en contenido de la plataforma</li>
                    <li>Daños resultantes del uso o incapacidad de usar el servicio</li>
                    <li>Contenido publicado por otros usuarios</li>
                    <li>Interrupciones temporales del servicio</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>9. Modificaciones de los Términos</h2>
                <p>Nos reservamos el derecho de:</p>
                <ul>
                    <li>Modificar estos términos en cualquier momento</li>
                    <li>Notificar cambios importantes a los usuarios</li>
                    <li>Exigir la reaceptación de términos modificados</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>10. Terminación del Servicio</h2>
                <p>Podemos suspender o terminar tu cuenta si:</p>
                <ul>
                    <li>Violas estos términos y condiciones</li>
                    <li>Publicas contenido inapropiado</li>
                    <li>Realizas actividades fraudulentas</li>
                    <li>Incumples las normas de la comunidad</li>
                </ul>
            </section>

            <section class="terms-section">
                <h2>11. Contacto</h2>
                <p>Para preguntas sobre estos términos:</p>
                <ul>
                    <li>Email: <a href="mailto:copypaste.batiz@gmail.com" class="inline-link">copypaste.batiz@gmail.com</a></li>
                    <li>Tiempo de respuesta: 3-5 días hábiles</li>
                </ul>
            </section>

            <div class="terms-footer">
                <p><strong>Al registrarte en TheHeartCloud, confirmas que has leído, comprendido y aceptado estos Términos y Condiciones en su totalidad.</strong></p>
                <p class="signature">El Equipo de TheHeartCloud</p>
            </div>
        `;

        this.termsContent.innerHTML = termsHTML;
    }

    showLoading() {
        this.termsContent.innerHTML = `
            <div class="loading-terms">
                <div class="loading-spinner"></div>
                <p>Cargando términos y condiciones...</p>
            </div>
        `;
    }

    showError() {
        this.termsContent.innerHTML = `
            <div class="error-terms">
                <p> Error cargando los términos. Por favor, intenta recargar la página.</p>
                <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }

    setupPrintButton() {
        // Agregar botón de imprimir si es necesario
        const printButton = document.createElement('button');
        printButton.textContent = ' Imprimir Términos';
        printButton.className = 'btn btn-secondary print-btn';
        printButton.onclick = () => window.print();
        
        const actions = document.querySelector('.terms-actions');
        if (actions) {
            actions.appendChild(printButton);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new TermsManager();
});
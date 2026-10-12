import { useSettings } from '@/hooks/queries';
import { CONTACT_EMAIL, LegalLayout, Section } from './LegalLayout';

export default function PrivacyPage() {
  const { data: s } = useSettings();
  const phone = s ? `+${s.whatsapp_number}` : 'nuestro WhatsApp oficial';

  return (
    <LegalLayout
      title="Política de tratamiento de datos personales"
      description="Cómo El Banquillo de Pablo recoge, usa y protege tus datos personales conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013."
      path="/privacidad"
      updated="12 de octubre de 2026"
    >
      <Section title="1. Responsable">
        <p>
          El Banquillo de Pablo, tienda virtual de camisetas de fútbol con operación en Colombia, es responsable del tratamiento de los
          datos que nos entregas. Contacto: <a className="text-volt underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> · WhatsApp {phone}.
        </p>
      </Section>

      <Section title="2. Qué datos recogemos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Nombre, cédula (opcional), celular, departamento, ciudad, dirección, barrio y referencia de entrega.</li>
          <li>Productos, tallas y personalización de tu pedido.</li>
          <li>Favoritos y carrito: se guardan <strong>solo en tu navegador</strong>, no en nuestros servidores.</li>
        </ul>
        <p>No pedimos ni almacenamos datos de tarjetas, contraseñas ni información bancaria en este sitio.</p>
      </Section>

      <Section title="3. Para qué los usamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Confirmar disponibilidad, precio y medio de pago de tu pedido.</li>
          <li>Coordinar el envío con la transportadora.</li>
          <li>Atender garantías, cambios y peticiones, quejas o reclamos.</li>
        </ul>
        <p>No vendemos ni cedemos tus datos a terceros. Solo los compartimos con la transportadora en lo necesario para la entrega.</p>
      </Section>

      <Section title="4. Tus derechos">
        <p>Como titular puedes, en cualquier momento y de forma gratuita:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Solicitar prueba de la autorización que nos diste.</li>
          <li>Revocar la autorización o pedir que eliminemos tus datos, salvo que exista un deber legal de conservarlos.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
        </ul>
      </Section>

      <Section title="5. Cómo ejercerlos">
        <p>
          Escríbenos a <a className="text-volt underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> indicando tu nombre, celular y la solicitud.
          Respondemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles, según la ley.
        </p>
      </Section>

      <Section title="6. Seguridad">
        <p>
          El sitio funciona sobre conexión cifrada (HTTPS). Los pedidos se guardan en una base de datos con controles de acceso: solo el
          administrador autenticado de la tienda puede consultarlos. Conservamos los datos mientras sean necesarios para la relación comercial
          y las obligaciones legales.
        </p>
      </Section>
    </LegalLayout>
  );
}

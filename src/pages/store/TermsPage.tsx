import { useSettings } from '@/hooks/queries';
import { CONTACT_EMAIL, LegalLayout, Section } from './LegalLayout';

export default function TermsPage() {
  const { data: s } = useSettings();
  const phone = s ? `+${s.whatsapp_number}` : 'nuestro número oficial';

  return (
    <LegalLayout
      title="Términos, envíos y compra segura"
      description="Cómo comprar en El Banquillo de Pablo: pedidos por WhatsApp, envíos a toda Colombia, cambios, garantía y derecho de retracto (Ley 1480 de 2011)."
      path="/terminos"
      updated="12 de octubre de 2026"
    >
      <Section title="Cómo comprar de forma segura">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Elige tu camiseta, talla y personalización, y agrégala al carrito.</li>
          <li>Completa tus datos de envío. Tu pedido queda registrado con un código (por ejemplo, BP-4F7A21).</li>
          <li>Te escribimos o nos escribes por WhatsApp para confirmar disponibilidad, precio final, envío y medio de pago.</li>
          <li>Solo después de confirmar todo realizas el pago por el medio acordado.</li>
        </ol>
        <p className="rounded-xl bg-surface p-4 ring-1 ring-line">
          <strong className="text-fg">Importante:</strong> nuestro único WhatsApp oficial es <strong className="text-volt">{phone}</strong>. Nunca te pediremos
          contraseñas, códigos de verificación ni datos de tu tarjeta. Si alguien lo hace en nuestro nombre, no respondas y avísanos.
        </p>
      </Section>

      <Section title="Precios y disponibilidad">
        <p>
          Los precios están en pesos colombianos (COP) e incluyen IVA cuando aplique. El valor del envío se informa antes de pagar.
          La disponibilidad de tallas se confirma por WhatsApp; si una talla se agota, te ofrecemos alternativas o no realizas el pago.
        </p>
      </Section>

      <Section title="Envíos">
        <p>
          Enviamos a todo el país con transportadoras nacionales. El tiempo estimado se confirma según tu ciudad. Te compartimos la guía de
          seguimiento cuando el pedido sale.
        </p>
      </Section>

      <Section title="Cambios y garantía">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Cambio de talla:</strong> dentro de los 5 días hábiles siguientes a la entrega, con la prenda sin uso y con etiquetas. El envío del cambio corre por cuenta del cliente, salvo error nuestro.</li>
          <li><strong>Garantía legal:</strong> si la prenda llega con defectos de fabricación, la cambiamos o devolvemos el dinero, según el Estatuto del Consumidor (Ley 1480 de 2011).</li>
          <li>Las camisetas <strong>personalizadas</strong> con nombre y número no tienen cambio de talla, salvo defecto de fabricación.</li>
        </ul>
      </Section>

      <Section title="Derecho de retracto">
        <p>
          En ventas a distancia puedes retractarte dentro de los 5 días hábiles siguientes a la entrega (art. 47, Ley 1480 de 2011), devolviendo
          el producto en el mismo estado. No aplica a productos personalizados. Te reintegramos el dinero en máximo 30 días calendario.
        </p>
      </Section>

      <Section title="Peticiones, quejas y reclamos">
        <p>
          Escríbenos a <a className="text-volt underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o por WhatsApp {phone} con tu código de pedido.
          También puedes acudir a la Superintendencia de Industria y Comercio (www.sic.gov.co).
        </p>
      </Section>
    </LegalLayout>
  );
}

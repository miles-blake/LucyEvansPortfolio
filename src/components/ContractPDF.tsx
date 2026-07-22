import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ContractBookingData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  eventDate: Date;
  eventType: string;
  totalPrice: number;    // cents
  depositAmount: number; // cents
  package?: { name: string } | null;
}

const s = StyleSheet.create({
  page: { padding: 52, fontFamily: "Helvetica", backgroundColor: "#FAF6EF", color: "#2E2A24" },
  company: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  tagline: { fontSize: 9, color: "#8A847C", marginTop: 3 },
  divider: { borderBottom: "1 solid #E5E0D8", marginVertical: 20 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#8A847C" },
  body: { fontSize: 10, lineHeight: 1.7, marginTop: 4 },
  paragraph: { marginBottom: 12 },
  signatureSection: { marginTop: 36, paddingTop: 16, borderTop: "1 solid #E5E0D8" },
  signatureRow: { flexDirection: "row", gap: 40, marginTop: 12 },
  signatureLine: { flex: 1 },
  signatureLabel: { fontSize: 8, color: "#8A847C", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  signatureUnderline: { borderBottom: "1 solid #2E2A24", paddingBottom: 18 },
});

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function replaceVars(body: string, booking: ContractBookingData): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return body
    .replace(/\{\{clientName\}\}/g, booking.customerName)
    .replace(/\{\{clientEmail\}\}/g, booking.customerEmail)
    .replace(/\{\{clientPhone\}\}/g, booking.customerPhone ?? "")
    .replace(/\{\{eventDate\}\}/g, fmtDate(booking.eventDate))
    .replace(/\{\{eventType\}\}/g, booking.eventType)
    .replace(/\{\{packageName\}\}/g, booking.package?.name ?? "")
    .replace(/\{\{totalPrice\}\}/g, fmtMoney(booking.totalPrice))
    .replace(/\{\{depositAmount\}\}/g, fmtMoney(booking.depositAmount))
    .replace(/\{\{bookingDate\}\}/g, today);
}

interface Props {
  booking: ContractBookingData;
  templateBody: string;
}

export function ContractPDF({ booking, templateBody }: Props) {
  const body = replaceVars(templateBody, booking);
  const paragraphs = body.split(/\n\n/);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View>
          <Text style={s.company}>Lucy Evans Photography</Text>
          <Text style={s.tagline}>lucyevans.com · hello@lucyevans.com</Text>
        </View>

        <View style={s.divider} />

        {/* Contract title */}
        <View style={{ marginBottom: 20 }}>
          <Text style={s.title}>Photography Services Agreement</Text>
          <Text style={s.subtitle}>Prepared for {booking.customerName} · {fmtDate(new Date())}</Text>
        </View>

        {/* Body */}
        <View>
          {paragraphs.map((para, i) => {
            const lines = para.split(/\n/);
            return (
              <View key={i} style={s.paragraph}>
                {lines.map((line, j) => (
                  <Text key={j} style={s.body}>{line}</Text>
                ))}
              </View>
            );
          })}
        </View>

        {/* Signature */}
        <View style={s.signatureSection}>
          <Text style={{ fontSize: 9, color: "#8A847C" }}>
            By signing below, both parties agree to the terms set forth in this agreement.
          </Text>
          <View style={s.signatureRow}>
            <View style={s.signatureLine}>
              <Text style={s.signatureLabel}>Client signature</Text>
              <View style={s.signatureUnderline} />
            </View>
            <View style={s.signatureLine}>
              <Text style={s.signatureLabel}>Date</Text>
              <View style={s.signatureUnderline} />
            </View>
          </View>
          <View style={[s.signatureRow, { marginTop: 24 }]}>
            <View style={s.signatureLine}>
              <Text style={s.signatureLabel}>Photographer (Lucy Evans)</Text>
              <View style={s.signatureUnderline} />
            </View>
            <View style={s.signatureLine}>
              <Text style={s.signatureLabel}>Date</Text>
              <View style={s.signatureUnderline} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

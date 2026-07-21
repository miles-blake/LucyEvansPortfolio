import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type LineItem = { description: string; amount: number };

export interface InvoiceData {
  number: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  lineItems: unknown;
  subtotal: number;
  depositPaid: number;
  amountDue: number;
  status: string;
  dueDate?: Date | null;
  createdAt: Date;
  notes?: string | null;
}

const s = StyleSheet.create({
  page: { padding: 52, fontFamily: "Helvetica", backgroundColor: "#FAF6EF", color: "#2E2A24" },
  company: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  tagline: { fontSize: 9, color: "#8A847C", marginTop: 3 },
  divider: { borderBottom: "1 solid #E5E0D8", marginVertical: 20 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  invoiceLabel: { fontSize: 9, color: "#8A847C", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  invoiceNumber: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  metaLabel: { fontSize: 8, color: "#8A847C", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 10, marginTop: 2 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 8, color: "#8A847C", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: "1 solid #E5E0D8" },
  lineRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottom: "1 solid #F0EBE3" },
  lineDesc: { fontSize: 10, flex: 1, paddingRight: 12 },
  lineAmt: { fontSize: 10 },
  totalArea: { marginTop: 12, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 200, paddingVertical: 3 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", width: 200, paddingTop: 6, marginTop: 4, borderTop: "1 solid #2E2A24" },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  totalAmt: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 28, fontSize: 9, color: "#8A847C", lineHeight: 1.6 },
  badge: { fontSize: 7, color: "#8A847C", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1 solid #B7CDB0", paddingBottom: 2 },
});

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function InvoicePDF({ invoice }: { invoice: InvoiceData }) {
  const items = (invoice.lineItems as LineItem[]) ?? [];
  const created = new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const due = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.row}>
          <View>
            <Text style={s.company}>Lucy Evans Photography</Text>
            <Text style={s.tagline}>lucyevans.com · hello@lucyevans.com</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.invoiceLabel}>Invoice</Text>
            <Text style={s.invoiceNumber}>{invoice.number}</Text>
            <Text style={[s.badge, { marginTop: 4 }]}>{invoice.status}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Meta row */}
        <View style={s.row}>
          <View>
            <Text style={s.metaLabel}>Bill to</Text>
            <Text style={s.metaValue}>{invoice.customerName}</Text>
            <Text style={[s.metaValue, { fontSize: 9, color: "#8A847C" }]}>{invoice.customerEmail}</Text>
            {invoice.customerPhone && (
              <Text style={[s.metaValue, { fontSize: 9, color: "#8A847C" }]}>{invoice.customerPhone}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.metaLabel}>Date issued</Text>
            <Text style={s.metaValue}>{created}</Text>
            {due && (
              <>
                <Text style={[s.metaLabel, { marginTop: 8 }]}>Due date</Text>
                <Text style={s.metaValue}>{due}</Text>
              </>
            )}
          </View>
        </View>

        {/* Line items */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Description</Text>
          {items.map((item, i) => (
            <View key={i} style={s.lineRow}>
              <Text style={s.lineDesc}>{item.description}</Text>
              <Text style={s.lineAmt}>
                {item.amount < 0 ? `−${fmt(Math.abs(item.amount))}` : fmt(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalArea}>
          {invoice.depositPaid > 0 && (
            <View style={s.totalRow}>
              <Text style={{ fontSize: 10, color: "#8A847C" }}>Deposit paid</Text>
              <Text style={{ fontSize: 10, color: "#8A847C" }}>−{fmt(invoice.depositPaid)}</Text>
            </View>
          )}
          <View style={s.totalLine}>
            <Text style={s.totalLabel}>Amount due</Text>
            <Text style={s.totalAmt}>{fmt(invoice.amountDue)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={s.notes}>
            <Text>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

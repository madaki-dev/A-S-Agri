const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function formatNaira(amount) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(Number(amount || 0));
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function createProductRows(items) {
    return items.map(item => {
        const product = item.product;

        const quantity = Number(item.quantity || 0);
        const sellingPrice = Number(item.sellingPrice || 0);
        const subtotal = sellingPrice * quantity;

        return `
            <tr>
                <td style="
                    padding: 12px;
                    border-bottom: 1px solid #e5e7eb;
                    color: #111827;
                ">
                    ${escapeHtml(product?.productName || "Product")}
                </td>

                <td style="
                    padding: 12px;
                    border-bottom: 1px solid #e5e7eb;
                    text-align: center;
                    color: #111827;
                ">
                    ${quantity}
                </td>

                <td style="
                    padding: 12px;
                    border-bottom: 1px solid #e5e7eb;
                    text-align: right;
                    color: #111827;
                ">
                    ${formatNaira(sellingPrice)}
                </td>

                <td style="
                    padding: 12px;
                    border-bottom: 1px solid #e5e7eb;
                    text-align: right;
                    color: #111827;
                ">
                    ${formatNaira(subtotal)}
                </td>
            </tr>
        `;
    }).join("");
}

function createEmailHtml({
    recipientName,
    order,
    items,
    recipientType
}) {
    const delivery = order.delivery || {};

    const productsTotal = items.reduce((total, item) => {
        return total +
            Number(item.sellingPrice || 0) *
            Number(item.quantity || 0);
    }, 0);

    const isFarmer = recipientType === "Farmer";

    const farmerSection = isFarmer
        ? `
            <div style="
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 16px;
                margin-top: 20px;
            ">
                <h3 style="
                    margin: 0 0 10px;
                    color: #166534;
                ">
                    Your Sale
                </h3>

                <p style="
                    margin: 5px 0;
                    color: #374151;
                ">
                    Your products in this order:
                </p>

                <p style="
                    margin: 5px 0;
                    font-weight: bold;
                    color: #111827;
                ">
                    ${formatNaira(productsTotal)}
                </p>
            </div>
        `
        : `
            <div style="
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                margin-top: 20px;
            ">
                <h3 style="
                    margin: 0 0 10px;
                    color: #111827;
                ">
                    Order Summary
                </h3>

                <p style="
                    margin: 5px 0;
                    color: #374151;
                ">
                    Products:
                    <strong>${formatNaira(productsTotal)}</strong>
                </p>

                <p style="
                    margin: 5px 0;
                    color: #374151;
                ">
                    Transport:
                    <strong>${formatNaira(order.transportFee)}</strong>
                </p>

                <p style="
                    margin: 10px 0 0;
                    color: #111827;
                    font-size: 18px;
                    font-weight: bold;
                ">
                    Total:
                    ${formatNaira(order.totalAmount)}
                </p>
            </div>
        `;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order - A&S Agri</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background: #f3f4f6;
    font-family: Arial, Helvetica, sans-serif;
">

    <div style="
        max-width: 680px;
        margin: 30px auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    ">

        <!-- Header -->
        <div style="
            background: #166534;
            padding: 25px;
            text-align: center;
        ">
            <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 28px;
            ">
                A&S Agri
            </h1>

            <p style="
                margin: 8px 0 0;
                color: #dcfce7;
                font-size: 14px;
            ">
                Agricultural Marketplace
            </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">

            <h2 style="
                margin-top: 0;
                color: #111827;
            ">
                ${isFarmer ? "New Order Received" : "New Order Placed"}
            </h2>

            <p style="
                color: #374151;
                line-height: 1.6;
            ">
                Hello ${escapeHtml(recipientName || "there")},
            </p>

            <p style="
                color: #374151;
                line-height: 1.6;
            ">
                ${isFarmer
            ? "A buyer has placed an order for your agricultural products on A&S Agri."
            : "A new order has been successfully placed on the A&S Agri marketplace."
        }
            </p>

            <!-- Order information -->
            <div style="
                background: #f9fafb;
                border-radius: 8px;
                padding: 18px;
                margin: 20px 0;
            ">

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>Order ID:</strong>
                    ${escapeHtml(order._id)}
                </p>

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>Status:</strong>
                    ${escapeHtml(order.status)}
                </p>

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>Transaction ID:</strong>
                    ${escapeHtml(order.transactionId)}
                </p>

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>Date:</strong>
                    ${new Date(order.createdAt).toLocaleString("en-NG")}
                </p>

            </div>

            <!-- Products -->
            <h3 style="
                color: #111827;
                margin-bottom: 10px;
            ">
                Products
            </h3>

            <div style="overflow-x: auto;">
                <table style="
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                ">

                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="
                                padding: 12px;
                                text-align: left;
                                color: #374151;
                            ">
                                Product
                            </th>

                            <th style="
                                padding: 12px;
                                text-align: center;
                                color: #374151;
                            ">
                                Qty
                            </th>

                            <th style="
                                padding: 12px;
                                text-align: right;
                                color: #374151;
                            ">
                                Price
                            </th>

                            <th style="
                                padding: 12px;
                                text-align: right;
                                color: #374151;
                            ">
                                Total
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        ${createProductRows(items)}
                    </tbody>

                </table>
            </div>

            ${farmerSection}

            <!-- Buyer / Delivery -->
            <div style="
                margin-top: 25px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            ">

                <h3 style="
                    margin-top: 0;
                    color: #111827;
                ">
                    Delivery Information
                </h3>

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>Name:</strong>
                    ${escapeHtml(delivery.fullname)}
                </p>

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>Phone:</strong>
                    ${escapeHtml(delivery.phone)}
                </p>

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>WhatsApp:</strong>
                    ${escapeHtml(delivery.whatsapp)}
                </p>

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>State:</strong>
                    ${escapeHtml(delivery.state)}
                </p>

                <p style="
                    margin: 6px 0;
                    color: #374151;
                ">
                    <strong>Address:</strong>
                    ${escapeHtml(delivery.address)}
                </p>

            </div>

            ${!isFarmer
            ? `
                    <div style="
                        margin-top: 25px;
                        padding: 18px;
                        background: #ecfdf5;
                        border-radius: 8px;
                    ">
                        <p style="
                            margin: 0;
                            color: #166534;
                            font-weight: bold;
                        ">
                            Payment has been successfully verified.
                        </p>
                    </div>
                    `
            : ""
        }

            <p style="
                margin-top: 30px;
                color: #6b7280;
                line-height: 1.6;
            ">
                Please log in to your A&S Agri dashboard to view and manage this order.
            </p>

        </div>

        <!-- Footer -->
        <div style="
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        ">

            <p style="
                margin: 0;
                color: #6b7280;
                font-size: 13px;
            ">
                © ${new Date().getFullYear()} A&S Agri. All rights reserved.
            </p>

        </div>

    </div>

</body>
</html>
`;
}

async function sendOrderEmail({
    to,
    recipientName,
    order,
    items,
    recipientType
}) {
    if (!to) {
        throw new Error("Recipient email is missing.");
    }

    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured.");
    }

    if (!process.env.RESEND_FROM_EMAIL) {
        throw new Error("RESEND_FROM_EMAIL is not configured.");
    }

    const subject =
        recipientType === "Farmer"
            ? `New Order Received - A&S Agri #${order._id}`
            : `New Order Placed - A&S Agri #${order._id}`;

    const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html: createEmailHtml({
            recipientName,
            order,
            items,
            recipientType
        })
    });

    if (response?.error) {
        throw new Error(
            response.error.message ||
            "Resend failed to send the email."
        );
    }

    return response;
}

module.exports = sendOrderEmail;
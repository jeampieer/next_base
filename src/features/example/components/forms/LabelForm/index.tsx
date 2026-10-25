"use client";
import { Form, Input } from "antd";
export function LabelForm() {
    return (
        <Form.Item
            name="name"
            label="Nombre"
            rules={[
                { required: true, whitespace: true, message: "Ingresa un nombre" },
                { max: 100, message: "Máximo 100 caracteres" },
            ]}
        >
            <Input maxLength={100} />
        </Form.Item>
    );
}

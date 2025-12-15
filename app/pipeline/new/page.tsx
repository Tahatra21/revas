"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SectionShell } from "@/components/ui/section-shell";

interface SBU {
    id: number;
    code: string;
    name: string;
}

interface Customer {
    id: number;
    name: string;
}

interface ServiceCategory {
    id: number;
    code: string;
    name: string;
    level: number;
}

export default function NewPipelinePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [sbus, setSbus] = useState<SBU[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        sbuId: "",
        customerId: "",
        jenisLayanan: "",
        serviceCategoryId: "",
        serviceCategory2Id: "",
        segmentIndustri: "",
        b2bFlag: "B2B",
        typePendapatan: "NR",
        namaLayanan: "",
        kapasitas: "",
        satuanKapasitas: "",
        originating: "",
        terminating: "",
        nilaiOtc: "",
        nilaiMrc: "",
        estRevenue: "",
        mappingRevenue: "",
        sumberAnggaran: "",
        fungsi: "",
        noInvoice: "",
        warnaStatusPotensi: "HIJAU",
        currentStatus: "",
    });

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [sbusRes, customersRes, categoriesRes] = await Promise.all([
                fetch("/api/master/sbu"),
                fetch("/api/master/customer"),
                fetch("/api/master/service-category"),
            ]);

            const [sbusData, customersData, categoriesData] = await Promise.all([
                sbusRes.json(),
                customersRes.json(),
                categoriesRes.json(),
            ]);

            setSbus(sbusData);
            setCustomers(customersData);
            setServiceCategories(categoriesData);
        } catch (error) {
            console.error("Error fetching master data:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.sbuId) newErrors.sbuId = "SBU is required";
        if (!formData.customerId) newErrors.customerId = "Customer is required";
        if (!formData.namaLayanan) newErrors.namaLayanan = "Service name is required";
        if (!formData.estRevenue) newErrors.estRevenue = "Estimated revenue is required";
        if (!formData.warnaStatusPotensi) newErrors.warnaStatusPotensi = "Status color is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            const payload = {
                sbuId: Number(formData.sbuId),
                customerId: Number(formData.customerId),
                jenisLayanan: formData.jenisLayanan || null,
                serviceCategoryId: formData.serviceCategoryId ? Number(formData.serviceCategoryId) : null,
                serviceCategory2Id: formData.serviceCategory2Id ? Number(formData.serviceCategory2Id) : null,
                segmentIndustri: formData.segmentIndustri || null,
                b2bFlag: formData.b2bFlag || null,
                typePendapatan: formData.typePendapatan || null,
                namaLayanan: formData.namaLayanan,
                kapasitas: formData.kapasitas || null,
                satuanKapasitas: formData.satuanKapasitas || null,
                originating: formData.originating || null,
                terminating: formData.terminating || null,
                nilaiOtc: formData.nilaiOtc ? Number(formData.nilaiOtc) : null,
                nilaiMrc: formData.nilaiMrc ? Number(formData.nilaiMrc) : null,
                estRevenue: Number(formData.estRevenue),
                mappingRevenue: formData.mappingRevenue ? Number(formData.mappingRevenue) : null,
                sumberAnggaran: formData.sumberAnggaran || null,
                fungsi: formData.fungsi || null,
                noInvoice: formData.noInvoice || null,
                warnaStatusPotensi: formData.warnaStatusPotensi,
                currentStatus: formData.currentStatus || null,
            };

            const response = await fetch("/api/pipeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to create pipeline");
            }

            const result = await response.json();
            router.push(`/pipeline/${result.id}`);
        } catch (error) {
            console.error("Error creating pipeline:", error);
            alert("Failed to create pipeline. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const level1Categories = serviceCategories.filter((c) => c.level === 1);
    const level2Categories = serviceCategories.filter((c) => c.level === 2);

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/pipeline">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Pipeline
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold">New Pipeline</h1>
                        <p className="text-primary-subtle">Create a new revenue opportunity</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <SectionShell title="Basic Information" description="Core pipeline details">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="SBU" htmlFor="sbuId" required error={errors.sbuId}>
                                <select name="sbuId" value={formData.sbuId} onChange={handleChange}>
                                    <option value="">Select SBU</option>
                                    {sbus.map((sbu) => (
                                        <option key={sbu.id} value={sbu.id}>
                                            {sbu.code} - {sbu.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Customer" htmlFor="customerId" required error={errors.customerId}>
                                <select name="customerId" value={formData.customerId} onChange={handleChange}>
                                    <option value="">Select Customer</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Service Name" htmlFor="namaLayanan" required error={errors.namaLayanan}>
                                <input
                                    type="text"
                                    name="namaLayanan"
                                    placeholder="e.g., Fiber Optic Backbone"
                                    value={formData.namaLayanan}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Service Type" htmlFor="jenisLayanan">
                                <input
                                    type="text"
                                    name="jenisLayanan"
                                    placeholder="e.g., Connectivity"
                                    value={formData.jenisLayanan}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Service Category (Level 1)" htmlFor="serviceCategoryId">
                                <select name="serviceCategoryId" value={formData.serviceCategoryId} onChange={handleChange}>
                                    <option value="">Select Category</option>
                                    {level1Categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Service Category (Level 2)" htmlFor="serviceCategory2Id">
                                <select name="serviceCategory2Id" value={formData.serviceCategory2Id} onChange={handleChange}>
                                    <option value="">Select Sub-Category</option>
                                    {level2Categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        </div>
                    </SectionShell>

                    {/* Revenue Information */}
                    <SectionShell title="Revenue Information" description="Financial details">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="Estimated Revenue" htmlFor="estRevenue" required error={errors.estRevenue}>
                                <input
                                    type="number"
                                    name="estRevenue"
                                    placeholder="0"
                                    value={formData.estRevenue}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Mapping Revenue" htmlFor="mappingRevenue">
                                <input
                                    type="number"
                                    name="mappingRevenue"
                                    placeholder="0"
                                    value={formData.mappingRevenue}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="OTC Value" htmlFor="nilaiOtc">
                                <input
                                    type="number"
                                    name="nilaiOtc"
                                    placeholder="0"
                                    value={formData.nilaiOtc}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="MRC Value" htmlFor="nilaiMrc">
                                <input
                                    type="number"
                                    name="nilaiMrc"
                                    placeholder="0"
                                    value={formData.nilaiMrc}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Revenue Type" htmlFor="typePendapatan">
                                <select name="typePendapatan" value={formData.typePendapatan} onChange={handleChange}>
                                    <option value="NR">NR (New Revenue)</option>
                                    <option value="CO">CO (Change Order)</option>
                                    <option value="LAIN_LAIN">Lain-lain</option>
                                </select>
                            </FormField>

                            <FormField label="Budget Source" htmlFor="sumberAnggaran">
                                <input
                                    type="text"
                                    name="sumberAnggaran"
                                    placeholder="e.g., CAPEX"
                                    value={formData.sumberAnggaran}
                                    onChange={handleChange}
                                />
                            </FormField>
                        </div>
                    </SectionShell>

                    {/* Technical Details */}
                    <SectionShell title="Technical Details" description="Service specifications">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="Capacity" htmlFor="kapasitas">
                                <input
                                    type="text"
                                    name="kapasitas"
                                    placeholder="e.g., 10 Gbps"
                                    value={formData.kapasitas}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Capacity Unit" htmlFor="satuanKapasitas">
                                <input
                                    type="text"
                                    name="satuanKapasitas"
                                    placeholder="e.g., Mbps"
                                    value={formData.satuanKapasitas}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Originating" htmlFor="originating">
                                <input
                                    type="text"
                                    name="originating"
                                    placeholder="Origin location"
                                    value={formData.originating}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Terminating" htmlFor="terminating">
                                <input
                                    type="text"
                                    name="terminating"
                                    placeholder="Destination location"
                                    value={formData.terminating}
                                    onChange={handleChange}
                                />
                            </FormField>
                        </div>
                    </SectionShell>

                    {/* Status Information */}
                    <SectionShell title="Status Information" description="Pipeline status and tracking">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="Status Color" htmlFor="warnaStatusPotensi" required error={errors.warnaStatusPotensi}>
                                <select name="warnaStatusPotensi" value={formData.warnaStatusPotensi} onChange={handleChange}>
                                    <option value="HIJAU">HIJAU (Most Likely)</option>
                                    <option value="KUNING">KUNING (Possible)</option>
                                    <option value="MERAH">MERAH (At Risk)</option>
                                </select>
                            </FormField>

                            <FormField label="Current Status" htmlFor="currentStatus">
                                <input
                                    type="text"
                                    name="currentStatus"
                                    placeholder="e.g., Proses BA"
                                    value={formData.currentStatus}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Segment Industry" htmlFor="segmentIndustri">
                                <input
                                    type="text"
                                    name="segmentIndustri"
                                    placeholder="e.g., Distribusi"
                                    value={formData.segmentIndustri}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="B2B Flag" htmlFor="b2bFlag">
                                <select name="b2bFlag" value={formData.b2bFlag} onChange={handleChange}>
                                    <option value="B2B">B2B</option>
                                    <option value="B2C">B2C</option>
                                    <option value="B2G">B2G</option>
                                </select>
                            </FormField>

                            <FormField label="Function" htmlFor="fungsi">
                                <input
                                    type="text"
                                    name="fungsi"
                                    placeholder="e.g., Distribusi"
                                    value={formData.fungsi}
                                    onChange={handleChange}
                                />
                            </FormField>

                            <FormField label="Invoice Number" htmlFor="noInvoice">
                                <input
                                    type="text"
                                    name="noInvoice"
                                    placeholder="Invoice number (if any)"
                                    value={formData.noInvoice}
                                    onChange={handleChange}
                                />
                            </FormField>
                        </div>
                    </SectionShell>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Link href="/pipeline">
                            <Button type="button" variant="ghost">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" isLoading={loading}>
                            Create Pipeline
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}

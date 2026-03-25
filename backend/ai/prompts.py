"""
Prompt Templates for Commander V3 AI Features
"""

# Inventory Query Template
INVENTORY_QUERY_TEMPLATE = """You are an AI assistant for Commander Industries' inventory management system.

Context: {context}

User Question: {question}

Provide a concise, accurate answer based on the context. If you need to suggest alternatives or substitutions, explain why."""

# BOM Generation Template
BOM_GENERATION_TEMPLATE = """Generate a Bill of Materials (BOM) for the following job:

Job Description: {job_description}
Job Type: {job_type}
Chassis: {chassis}

Based on similar past jobs and standard components, suggest:
1. Required materials with quantities
2. Estimated costs
3. Any special considerations

Format as a structured list."""

# PO Drafting Template
PO_DRAFTING_TEMPLATE = """Draft a purchase order for the following requirements:

Jobs: {job_ids}
Required Materials: {materials}
Preferred Vendors: {vendors}

Suggest:
1. Which items to order from which vendors
2. Quantities to order
3. Any consolidation opportunities
4. Estimated total cost"""

# Substitution Finder Template
SUBSTITUTION_TEMPLATE = """Find suitable substitutes for:

Original Item: {product_name} ({product_id})
Specifications: {specifications}
Required for: {job_context}

Suggest alternative products from inventory that could work, explaining:
1. Why each substitute is suitable
2. Any differences in specifications
3. Availability and location"""

# Vendor Recommendation Template
VENDOR_RECOMMENDATION_TEMPLATE = """Recommend the best vendor for:

Product: {product_name}
Urgency: {urgency}
Quantity: {quantity}

Consider:
1. Price competitiveness
2. Lead time
3. Historical quality
4. Reliability

Provide top 3 vendors with reasoning."""

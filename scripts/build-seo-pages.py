import zipfile
import xml.etree.ElementTree as ET
import json
import os
from collections import defaultdict

def build_seo_pages():
    xlsx_path = "keyword-plan-ranked.xlsx"
    if not os.path.exists(xlsx_path):
        xlsx_path = "keyword-plan-ranked (1).xlsx"
        
    print(f"Reading {xlsx_path}...")
    
    with zipfile.ZipFile(xlsx_path, "r") as z:
        sheet2 = ET.fromstring(z.read("xl/worksheets/sheet2.xml"))
        ns = {"ns": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        rows = sheet2.findall("ns:sheetData/ns:row", ns)
        
        skipped_keywords = []
        page_keywords = defaultdict(list)
        
        for r in rows[1:]:
            cells = r.findall("ns:c", ns)
            row_dict = {}
            for c in cells:
                ref = c.attrib.get("r", "")
                col = "".join([ch for ch in ref if ch.isalpha()])
                t = c.find("ns:v", ns)
                val = t.text if t is not None else ""
                if not val:
                    is_tag = c.find("ns:is/ns:t", ns)
                    if is_tag is not None:
                        val = is_tag.text
                row_dict[col] = val
                
            rank = int(row_dict.get("A", 999999))
            kw = row_dict.get("B", "").strip()
            cluster = row_dict.get("C", "").strip()
            target = row_dict.get("D", "").strip()
            market = row_dict.get("E", "").strip()
            vol = int(float(row_dict.get("F", "0") or "0"))
            kd_val = row_dict.get("G", "").strip()
            kd = int(float(kd_val)) if kd_val else None
            cpc = float(row_dict.get("H", "0") or "0")
            score = float(row_dict.get("I", "0") or "0")
            intent = row_dict.get("J", "").strip()
            tier = row_dict.get("K", "").strip()
            
            # 1. Drop competitor-brand and skipped keywords
            if "skip" in tier.lower() or "skip" in target.lower():
                skipped_keywords.append({
                    "rank": rank,
                    "keyword": kw,
                    "cluster": cluster,
                    "reason": tier or target,
                    "searches": vol
                })
                continue
                
            item = {
                "rank": rank,
                "keyword": kw,
                "cluster": cluster,
                "monthly_searches": vol,
                "kd": kd,
                "cpc_usd": cpc,
                "score": score,
                "intent": intent,
                "tier": tier
            }
            
            # 2. Map keyword to planned page
            if "depop" in kw.lower():
                dest = "/depop-fee-calculator/"
            elif target == "(use as H2/FAQ on nearest page)":
                if "paypal" in kw.lower():
                    dest = "/ebay-and-paypal-fee-calculator/"
                elif "ebay" in kw.lower():
                    dest = "/ebay-fee-calculator/"
                else:
                    dest = "/marketplace-fee-calculators/"
            elif target == "(not planned: KD 32-50)":
                dest = "/marketplace-fee-calculators/"
            elif target.startswith("/"):
                dest = target.rstrip("/") + "/"
            else:
                dest = "/marketplace-fee-calculators/"
                
            page_keywords[dest].append(item)

    # Metadata, Titles (max 60), Meta Descriptions (max 160), H1s, and ogTitles
    page_definitions = [
        {
            "url": "/ebay-fee-calculator/",
            "primary_keyword": "ebay fee calculator",
            "title": "eBay Fee Calculator: Calculate Net Profit & Fees (2026)",
            "h1": "Calculate Your Exact eBay Seller Fees & Take-Home Profit",
            "metaDescription": "Calculate your exact eBay seller fees, payment processing, and final value rates. Enter your price to see your real take-home profit before you list today.",
            "ogTitle": "eBay Fee Calculator - Free & Accurate Reseller Profit Tool",
            "search_intent": "Commercial",
            "tier": "Later (KD over 35)",
            "cluster": "eBay generic fee calculator",
            "target_market": "US",
            "monthly_searches": 27100,
            "kd": 36,
            "cpc_usd": 0.42
        },
        {
            "url": "/ebay-fee-calculator-uk/",
            "primary_keyword": "ebay fee calculator uk",
            "title": "eBay Fee Calculator UK: 0% Private & Business Fees (2026)",
            "h1": "Free eBay UK Fee Calculator for Private & Business Sellers",
            "metaDescription": "Calculate eBay UK fees with 0% private seller rates, 20% VAT, and business tiers. Enter your item price to see your exact payout before listing in the UK.",
            "ogTitle": "eBay Fee Calculator UK - 0% Private Seller Fee Estimator",
            "search_intent": "Commercial",
            "tier": "Tier 2 (KD 26-35)",
            "cluster": "eBay UK",
            "target_market": "UK",
            "monthly_searches": 2400,
            "kd": 34,
            "cpc_usd": 0.35
        },
        {
            "url": "/etsy-fee-calculator/",
            "primary_keyword": "etsy fee calculator",
            "title": "Etsy Fee Calculator: Accurate Seller Profit & Fees (2026)",
            "h1": "Calculate Your True Etsy Seller Fees, Margins & Net Profit",
            "metaDescription": "Calculate exact Etsy fees including 6.5% transaction, listing, and payment processing. Enter your item costs to see your net profit before listing your item.",
            "ogTitle": "Etsy Fee Calculator - Know Your Exact Fees Before Listing",
            "search_intent": "Informational",
            "tier": "Tier 1 (KD 25 or lower)",
            "cluster": "Etsy fee calculator",
            "target_market": "US",
            "monthly_searches": 2400,
            "kd": 25,
            "cpc_usd": 0.31
        },
        {
            "url": "/twitch-bits-to-usd/",
            "primary_keyword": "twitch bits to usd",
            "title": "Twitch Bits to USD: Convert Bits to Streamer Payout (2026)",
            "h1": "Convert Twitch Bits into Exact Creator Cash Payouts",
            "metaDescription": "Convert Twitch bits to USD instantly at the official 1 cent per bit streamer rate. Enter any bit amount to calculate your total creator earnings right now.",
            "ogTitle": "Twitch Bits to USD Calculator - Streamer Earnings Estimator",
            "search_intent": "Informational",
            "tier": "Tier 1 (KD 25 or lower)",
            "cluster": "Twitch bits to USD",
            "target_market": "US",
            "monthly_searches": 1000,
            "kd": 17,
            "cpc_usd": 0.0
        },
        {
            "url": "/whatnot-fee-calculator/",
            "primary_keyword": "whatnot fee calculator",
            "title": "Whatnot Fee Calculator: Live Sale Commission & Profit",
            "h1": "Calculate Your Whatnot Commission, Fees and Net Margin",
            "metaDescription": "Calculate exact Whatnot live seller fees with 8.0% commission and 2.9% payment processing. Enter your hammer price to see what you keep before your next stream.",
            "ogTitle": "Whatnot Fee Calculator - Live Auction Seller Profit Tool",
            "search_intent": "Commercial",
            "tier": "Tier 1 (KD 25 or lower)",
            "cluster": "Whatnot fee calculator",
            "target_market": "US",
            "monthly_searches": 590,
            "kd": 3,
            "cpc_usd": 0.0
        },
        {
            "url": "/ebay-final-value-fee-calculator/",
            "primary_keyword": "ebay final value fee calculator",
            "title": "eBay Final Value Fee Calculator: Category FVF Tiers (2026)",
            "h1": "Calculate Category-Specific eBay Final Value Rates & Fees",
            "metaDescription": "Calculate exact eBay final value fees across electronics, sneakers, watches, and guitars. Check category percentage rates to optimize your seller profit today.",
            "ogTitle": "eBay Final Value Fee Calculator - Category-Specific FVF Tool",
            "search_intent": "Informational",
            "tier": "Tier 2 (KD 26-35)",
            "cluster": "eBay final value fee",
            "target_market": "US",
            "monthly_searches": 480,
            "kd": 31,
            "cpc_usd": 0.28
        },
        {
            "url": "/ebay-and-paypal-fee-calculator/",
            "primary_keyword": "ebay and paypal fee calculator",
            "title": "eBay and PayPal Fee Calculator: Legacy vs Modern Fees",
            "h1": "Compare Legacy eBay + PayPal Fees with Managed Payments",
            "metaDescription": "Calculate combined eBay and PayPal transaction fees compared to modern Managed Payments. Enter sale figures to see historical fee differences before you sell.",
            "ogTitle": "eBay & PayPal Fee Calculator - Compare Legacy vs Managed Rates",
            "search_intent": "Informational",
            "tier": "Tier 1 (KD 25 or lower)",
            "cluster": "eBay + PayPal (legacy)",
            "target_market": "US",
            "monthly_searches": 210,
            "kd": 25,
            "cpc_usd": 0.22
        },
        {
            "url": "/ebay-shipping-fee-calculator/",
            "primary_keyword": "ebay shipping fee calculator",
            "title": "eBay Shipping Fee Calculator: FVF on Shipping Rates (2026)",
            "h1": "Calculate eBay Fees Charged on Buyer-Paid Shipping Costs",
            "metaDescription": "Calculate how eBay final value fees apply to buyer-paid shipping and postage charges. Enter your shipping numbers to protect your reseller margins on shipping.",
            "ogTitle": "eBay Shipping Fee Calculator - Avoid Fee Surprises on Shipping",
            "search_intent": "Informational",
            "tier": "Tier 2 (KD 26-35)",
            "cluster": "eBay shipping/handling",
            "target_market": "US",
            "monthly_searches": 210,
            "kd": 35,
            "cpc_usd": 0.20
        },
        {
            "url": "/tiktok-shop-fee-calculator/",
            "primary_keyword": "tiktok shop fee calculator",
            "title": "TikTok Shop Fee Calculator: Referral Fees & Profit (2026)",
            "h1": "Calculate Real TikTok Shop Referral Fees and Net Profit",
            "metaDescription": "Calculate exact TikTok Shop seller fees with 6.0% referral rates and payment deductions. Enter your product price to preview take-home earnings before listing.",
            "ogTitle": "TikTok Shop Fee Calculator - Free E-Commerce Seller Estimator",
            "search_intent": "Informational",
            "tier": "Tier 1 (KD 25 or lower)",
            "cluster": "TikTok Shop fee calculator",
            "target_market": "US",
            "monthly_searches": 170,
            "kd": 8,
            "cpc_usd": 0.0
        },
        {
            "url": "/ebay-profit-calculator/",
            "primary_keyword": "ebay after fees calculator",
            "title": "eBay After Fees Calculator: Reverse Profit & Margin (2026)",
            "h1": "Calculate Real Take-Home Profit and ROI on Every eBay Sale",
            "metaDescription": "Calculate your exact net profit after eBay fees, item cost, and postage. Enter your target profit or margin to find the required listing price before you sell.",
            "ogTitle": "eBay Profit Calculator - Reverse Pricing & Margin Tool",
            "search_intent": "Informational",
            "tier": "Tier 2 (KD 26-35)",
            "cluster": "eBay profit after fees",
            "target_market": "US",
            "monthly_searches": 110,
            "kd": 31,
            "cpc_usd": 0.18
        },
        {
            "url": "/etsy-offsite-ads-fee-calculator/",
            "primary_keyword": "etsy offsite ads fees",
            "title": "Etsy Offsite Ads Fees: 12% vs 15% Ad Calculator (2026)",
            "h1": "Calculate the Real Cost of Etsy Mandatory & Optional Ads",
            "metaDescription": "Calculate Etsy offsite ads fees at mandatory 12% ($10k+ revenue) or optional 15% tiers. Enter your item price to see how ad attribution impacts profit margins.",
            "ogTitle": "Etsy Offsite Ads Fee Calculator - 12% vs 15% Profit Impact",
            "search_intent": "Informational",
            "tier": "Tier 2 (KD 26-35)",
            "cluster": "Etsy offsite ads",
            "target_market": "US",
            "monthly_searches": 50,
            "kd": 34,
            "cpc_usd": 0.15
        },
        {
            "url": "/depop-fee-calculator/",
            "primary_keyword": "depop seller fees calculator",
            "title": "Depop Seller Fees Calculator: 0% Fee & Processing (2026)",
            "h1": "Calculate Depop Payment Processing Fees and Payout Total",
            "metaDescription": "Calculate Depop fees with 0% selling fee and 3.3% + $0.45 payment processing. Enter your sale price to calculate take-home profit before listing your items.",
            "ogTitle": "Depop Fee Calculator - 0% Selling Fee & Profit Estimator",
            "search_intent": "Informational",
            "tier": "Tier 1 (KD 25 or lower)",
            "cluster": "Other resale marketplaces",
            "target_market": "US",
            "monthly_searches": 40,
            "kd": 2,
            "cpc_usd": 0.0
        },
        {
            "url": "/marketplace-fee-calculators/",
            "primary_keyword": "seller fee calculator",
            "title": "Seller Fee Calculator: Compare Marketplace Profits (2026)",
            "h1": "Compare Reseller Fees Across Whatnot, TikTok, Etsy & eBay",
            "metaDescription": "Compare seller fees side by side across Whatnot, TikTok Shop, Depop, Etsy and eBay. Enter your price once to see which platform pays you the highest profit.",
            "ogTitle": "Marketplace Fee Calculator - Side-by-Side Profit Comparison",
            "search_intent": "Commercial",
            "tier": "Unscored, 30+ searches",
            "cluster": "Generic seller fee calculator",
            "target_market": "US",
            "monthly_searches": 40,
            "kd": None,
            "cpc_usd": 0.25
        }
    ]

    # Validate that no keyword is primary for two pages
    primary_kws = [p["primary_keyword"] for p in page_definitions]
    duplicate_primaries = set([kw for kw in primary_kws if primary_kws.count(kw) > 1])
    if duplicate_primaries:
        raise ValueError(f"CRITICAL ERROR: Duplicate primary keywords found: {duplicate_primaries}")

    pages_output = []
    
    for p_def in page_definitions:
        url = p_def["url"]
        prim_kw = p_def["primary_keyword"]
        raw_variants = page_keywords.get(url, [])
        
        # Sort variants by monthly searches descending, then rank ascending
        sorted_variants = sorted(raw_variants, key=lambda x: (x["monthly_searches"], -x["rank"]), reverse=True)
        
        # Filter out the primary keyword itself from supporting variants list
        filtered_variants = [v for v in sorted_variants if v["keyword"].lower() != prim_kw.lower()]
        
        # Structure supporting variants with recommendation on usage (H2 or FAQ)
        formatted_variants = []
        for v in filtered_variants:
            is_faq = any(v["keyword"].lower().startswith(q) for q in ["how", "what", "is", "does", "can", "why", "who"]) or "?" in v["keyword"]
            suggested_placement = "FAQ Question" if is_faq else "H2 Section Header"
            
            formatted_variants.append({
                "keyword": v["keyword"],
                "cluster": v["cluster"],
                "monthly_searches": v["monthly_searches"],
                "kd": v["kd"],
                "cpc_usd": v["cpc_usd"],
                "intent": v["intent"],
                "tier": v["tier"],
                "suggested_placement": suggested_placement
            })
            
        page_entry = {
            "url": url,
            "title": p_def["title"],
            "metaDescription": p_def["metaDescription"],
            "h1": p_def["h1"],
            "ogTitle": p_def["ogTitle"],
            "target_market": p_def["target_market"],
            "cluster": p_def["cluster"],
            "primary_keyword": prim_kw,
            "search_intent": p_def["search_intent"],
            "tier": p_def["tier"],
            "monthly_searches": p_def["monthly_searches"],
            "kd": p_def["kd"],
            "cpc_usd": p_def["cpc_usd"],
            "total_supporting_variants": len(formatted_variants),
            "supporting_variants": formatted_variants
        }
        pages_output.append(page_entry)

    # 3. Competing Pages & Keyword Cannibalization Mapping
    competing_pages = [
        {
            "query": "ebay seller fees calculator",
            "competing_urls": [
                "/ebay-fee-calculator/",
                "/ebay-and-paypal-fee-calculator/"
            ],
            "overlap_nature": "General eBay seller fee calculation vs legacy Managed Payments + PayPal calculation",
            "resolution_strategy": "/ebay-fee-calculator/ is the canonical destination for modern Managed Payments (13.25% + $0.40); /ebay-and-paypal-fee-calculator/ is dedicated to legacy fee structures, historical fee models, and PayPal merchant comparisons."
        },
        {
            "query": "ebay final value fee calculator",
            "competing_urls": [
                "/ebay-fee-calculator/",
                "/ebay-final-value-fee-calculator/"
            ],
            "overlap_nature": "All-in-one fee calculation vs category-specific tiered Final Value Fee rates",
            "resolution_strategy": "/ebay-final-value-fee-calculator/ is specifically focused on category-tier breakdown tables (e.g. guitars, watches, heavy equipment, sneakers) with detailed rate ladders; /ebay-fee-calculator/ serves general listing profitability."
        },
        {
            "query": "ebay profit after fees calculator",
            "competing_urls": [
                "/ebay-fee-calculator/",
                "/ebay-profit-calculator/"
            ],
            "overlap_nature": "Forward fee deductions vs net margin and target ROI pricing",
            "resolution_strategy": "/ebay-profit-calculator/ specifically targets reverse-pricing mode (calculating required sale price from target profit or target margin %) and break-even pricing; /ebay-fee-calculator/ focuses on forward fee deductions."
        },
        {
            "query": "ebay shipping fee calculator",
            "competing_urls": [
                "/ebay-fee-calculator/",
                "/ebay-shipping-fee-calculator/"
            ],
            "overlap_nature": "Total transaction fee on shipping vs standalone shipping handling deductions",
            "resolution_strategy": "/ebay-shipping-fee-calculator/ educates sellers on how eBay applies the full FVF percentage to buyer-paid shipping and calculates net shipping margins; /ebay-fee-calculator/ incorporates shipping into gross total."
        },
        {
            "query": "ebay fee calculator uk",
            "competing_urls": [
                "/ebay-fee-calculator/",
                "/ebay-fee-calculator-uk/"
            ],
            "overlap_nature": "Regional/currency ambiguity when UK searchers type generic fee queries",
            "resolution_strategy": "/ebay-fee-calculator-uk/ explicitly targets the UK market (£ GBP, 0% private seller fee, 20% VAT on business fees, and Regulatory Operating fees); /ebay-fee-calculator/ targets US $ USD rates."
        },
        {
            "query": "etsy offsite ads fees",
            "competing_urls": [
                "/etsy-fee-calculator/",
                "/etsy-offsite-ads-fee-calculator/"
            ],
            "overlap_nature": "Base Etsy seller fees vs 12% / 15% offsite advertising fee surcharges",
            "resolution_strategy": "/etsy-offsite-ads-fee-calculator/ targets shop owners navigating mandatory 12% ($10k+ revenue) and optional 15% offsite ads; /etsy-fee-calculator/ models standard 6.5% transaction and listing fees."
        },
        {
            "query": "marketplace fee calculator",
            "competing_urls": [
                "/marketplace-fee-calculators/",
                "/depop-fee-calculator/"
            ],
            "overlap_nature": "Multi-marketplace comparison queries vs individual marketplace calculations",
            "resolution_strategy": "/marketplace-fee-calculators/ acts as the hub page targeting cross-platform comparison searches across all platforms; /depop-fee-calculator/ serves single-platform Depop queries."
        }
    ]

    final_document = {
        "$schema": "./schema.json",
        "title": "Seller Calc Hub - SEO Keyword-to-Page Architecture Map",
        "version": "1.0.0",
        "generated_on": "2026-11-22",
        "source": {
            "file": "keyword-plan-ranked.xlsx",
            "sheet": "English ranked",
            "total_raw_keywords": len(rows) - 1,
            "dropped_skipped_keywords": len(skipped_keywords),
            "active_mapped_keywords": sum(len(p["supporting_variants"]) + 1 for p in pages_output)
        },
        "audit_checks": {
            "single_primary_keyword_per_page_enforced": True,
            "no_duplicate_primary_keywords": len(duplicate_primaries) == 0,
            "duplicate_primary_keywords_found": list(duplicate_primaries),
            "competitor_brands_dropped": True,
            "dropped_keywords_count": len(skipped_keywords)
        },
        "competing_pages": competing_pages,
        "dropped_skip_keywords": skipped_keywords,
        "pages": pages_output
    }

    os.makedirs("src/data/seo", exist_ok=True)
    out_file = "src/data/seo/pages.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(final_document, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Successfully created {out_file} with {len(pages_output)} planned URLs and {final_document['source']['active_mapped_keywords']} mapped keywords.")
    print(f"✅ Dropped {len(skipped_keywords)} skipped keywords.")
    print(f"✅ Primary keyword collision check: {len(duplicate_primaries)} collisions.")

if __name__ == "__main__":
    build_seo_pages()

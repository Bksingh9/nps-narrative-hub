#!/bin/bash

# Fetch all messages and we'll filter for failed ones later
echo "🔄 Fetching all payment messages from Kafka (will filter for failed later)..."

curl 'https://kafka-ui-m1.core.jiocommerce.io/api/clusters/sng-internal-kafka-cluster/topics/fynd-json-gringotts-payment_status/messages/v2?limit=500&mode=LATEST&keySerde=String&smartFilterId=dc1bc0db' \
  -H 'accept: text/event-stream' \
  -H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
  -b '_fw_crm_v=56ad4844-c74b-4c36-f7a9-cc25d276b5f5; _ga=GA1.1.1356959313.1753555490; _ga_FMV8PY3WHY=GS2.1.s1754387491$o1$g1$t1754387794$j60$l0$h0; organizationId=68933f2611d0e8befb2e4431; _ga_M20NJWL0VQ=GS2.1.s1754486991$o3$g0$t1754486991$j60$l0$h0; _ga_442GM95NLE=GS2.1.s1754569758$o7$g0$t1754569758$j60$l0$h0; _clck=1mip53e%7C2%7Cfyd%7C0%7C2043; _ga_2LF9GRVGHM=GS2.1.s1754890222$o7$g0$t1754890244$j38$l0$h0; x.session=s%3AfMbiI_bsbZbml58Xzl3axmJhib4Cry1d.raptQZ7AURNSyGMwtHnyYi6aRbiFyV%2FZqqAmsFuBnmg; company_id=1; _ga_TKHKM52Q5T=GS2.1.s1755012884$o12$g0$t1755012884$j60$l0$h0; _oauth2_proxy=Y5sk5HOopZNHJv-jPkrtMrhG8X2YreKn5F6K14WUFAyGIXbw0b2S6hhBl8AeBa5HB7qTtZPaX_7yFtWYu_YC10Ntv_Ipq5WRV3m2XlL8sRceZ1AZKmmwca6pEoxsQz55_jRqwJOkp5gZroRyJHfKLNUrjZbAbPZbjby7E_qwlrh3YTBwVPobYMkzg_VDTapS4gB-2MvB5bMNiOtlR-AXltIdNfKyjhBVQpry6lIIP-r9j7Q7Xr5_v_mfqNDMqhk1ogFJSWuANOhAtE1NVz-ap5abK61FV1tfX0pTYK97dwntQr40z8DXQgZNgL-uHPp1ZNq4Wa-6lwjZ39PibVMRgEZU3iUqfKkCsaJGryA4Xlq8oiDmWCxW5NDcnQeBIcp0RUX0WXjImmjTcZJM7-EM05QPPtW9DwsmdiVMx5ck1eFrFqQXRurJGaYjG3EliBF3PbWKi5rNj1MwcJUp_ltSADOtgLlUmEQKb5THCYCmecpd-41qzfzYO03G1gdS97d0sqCR8FXhkxcuJO98qUGlW2Nn1S1g0NSSj_OoUCgZ25uFMmNdVPk9QJnOC8hdsRc0kFUd0VHuZXAQ7XfA20r912m95GAvIBqkSVrEUHhBfEqRgJXYWzJaECQ9HweYLPnxqeoJm9EGQRaObHz2uHjGucLiuK32epm_vpF13eFFL4-C-q1cbaWSlYxKcG3g0zHAuEdSUbd8Hk1nTvPsLml0tPLRc-DKBh-bb81ExK_6IpOCd0n2d4PwCqOUVq-2rd2VM0iignsWAOjxVGfEDDEUgQl-zSJYzZcRyYBLZVLMT9eNsSg8O_LbwwCVMOCfl_qSMw8XYrvVdPuEYatUtUFpLgI3pjrlpX6CgFVwW_OP_i41xJmCQqrPCY-3wv7xZ9jmvmQVqvEiLsPPxzfsiNqA_RQKHR2I4IdiX6p8h_-cHiwuRjjZH7r9WzC1m0iHHfNgchWNVZg6BhTD8HXm1kP4vDxvZAI-65uNo-MHHkTTuG6QA_mK9ZU18WBw_AYZ-6ODK7IZYT_Mrz-i4I4Kl3k1L8hx26lkql3uLe_CXBsKdIazObFoTZV_EP2c2Efz2YqR841cnPEcarBHfyVfKawoHv8K8tJJRrFPWyeS2GyDMa3hF2NlDh-9okPeG1dAoHeb8YXxxSrmK-LLUQa8PfPNtXWq5h5D9yBpk8DNQXKTy_9KyoSGQU0KK02azAq4oWoNHLmVoMC-_kcx9DDWHX9DKioSgRIupKgiwiMWWbXIE44nDrKLE89SkjdnbJX1_Tqx8Xq0aWsL0KMm---AELfhMKCjZYVloICQXEs7InXzhh0B_Y_JB_8VawPcvZvm8eA407qiMaJZSqGR_adIEkxzbyByeXau0r7Gwo7nOVsyfAIn8H_Xiw16V16PdAMP1lUPVr-MAWmOspQvord9QX8nPlSV2Z3UuywQSJX6MFqTID-Cwed0OdVRcbi-IrZCpV5o_AkwwSD0fihqrVORDVTAUzUCc3BgNnMiqVljHrG-QSSz_6cMHy5_vITYN1w9MVdZE-H_l8MYbPuR7ZDSCLWsJ5MC5cI3pNBvZWZIDF-cVBrQFbD6W5bTx00CIM4x0tuj-kfEZxQdNJ-ijj6pwKYQISaCPMhhpUCFtF7HdhxeHzWwCNpX4BPLLTVhCG7g7d-OJH18g-4M30N8fscPrNDdbvR3pKTcuS9SvuztjyNBjTeAjVjK92tXA8wS_OIVZa-pxIGiPX57A8SJMATW6wf1GtbysBg3R_91cEELuCNoB_T2UtYgWq1ANwvkjNbNtVpor3cVdmDf0aontbg=|1755064285|FXZ0gw4sYN_jWRkbmvKIHAQOp-Y2E7OmaKogOIqUivE=; SESSION=8ce6eb6b-9fd9-4dac-b7c4-277d8003e52f' \
  -H 'priority: u=1, i' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -o all_payments_raw.json

echo "✅ Data saved to all_payments_raw.json" 
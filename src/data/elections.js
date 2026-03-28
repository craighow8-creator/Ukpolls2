// Elections 2026 — Full council dataset
// Source: Politiscope research — May 7 2026 local elections
// Covers: 21 County Councils, 36 Metropolitan Boroughs (1/3 seats),
//         32 London Boroughs + City of London (all seats),
//         ~60 Unitary Authorities, ~80 District/Borough Councils
//         + Scottish Parliament + Senedd

export const LOCAL_ELECTIONS = {
  date: '7 May 2026',
  totalSeats: 6500,
  councils: [

    // ── COUNTY COUNCILS (all seats up) ─────────────────────────────
    {name:'Cambridgeshire',     region:'East',          type:'County',   control:'Con',  noc:false, seats:61,  majority:5,  lastFought:2021, watchFor:'Reform surge in Leave-heavy rural areas. LD targeting urban Cambridge fringe.',            verdict:'Con defend',          difficulty:'hard'},
    {name:'Devon',              region:'South West',    type:'County',   control:'Con',  noc:false, seats:60,  majority:8,  lastFought:2021, watchFor:'Con defending 2021 peak. LD making inroads in coastal and university towns.',                verdict:'Con defend',          difficulty:'hard'},
    {name:'Essex',              region:'East',          type:'County',   control:'Con',  noc:false, seats:75,  majority:20, lastFought:2021, watchFor:'Reform UK targeting Leave-voting Essex heartlands. Could be their biggest prize.',            verdict:'Reform target',       difficulty:'very hard'},
    {name:'Gloucestershire',    region:'South West',    type:'County',   control:'Con',  noc:false, seats:53,  majority:6,  lastFought:2021, watchFor:'Three-way marginal. LD, Green and Reform all competitive.',                                verdict:'Toss-up',             difficulty:'very hard'},
    {name:'Hampshire',          region:'South East',    type:'County',   control:'Con',  noc:false, seats:78,  majority:16, lastFought:2021, watchFor:'LD Blue Wall advance. Con defending large majority won at Johnson-era peak.',                verdict:'LD opportunity',      difficulty:'hard'},
    {name:'Hertfordshire',      region:'East',          type:'County',   control:'Con',  noc:false, seats:78,  majority:26, lastFought:2021, watchFor:'Con stronghold but Reform polling well in Leave areas.',                                   verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Kent',               region:'South East',    type:'County',   control:'Con',  noc:false, seats:81,  majority:24, lastFought:2021, watchFor:'Reform UK prime target. High Leave vote, coastal towns. Biggest test of Reform ground game.',verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Lancashire',         region:'North West',    type:'County',   control:'Lab',  noc:false, seats:84,  majority:4,  lastFought:2021, watchFor:'Lab on knife-edge. Reform targeting ex-Red Wall seats. Very thin majority.',               verdict:'Lab existential',     difficulty:'very hard'},
    {name:'Leicestershire',     region:'East Midlands', type:'County',   control:'Con',  noc:false, seats:55,  majority:6,  lastFought:2021, watchFor:'Con defending narrow majority. Reform and Lab both competitive.',                         verdict:'Three-way marginal',  difficulty:'very hard'},
    {name:'Lincolnshire',       region:'East Midlands', type:'County',   control:'Con',  noc:false, seats:70,  majority:28, lastFought:2021, watchFor:'Strong Leave county. Reform could make big gains but Con majority is large.',              verdict:'Reform gains likely',  difficulty:'medium'},
    {name:'Norfolk',            region:'East',          type:'County',   control:'Con',  noc:false, seats:84,  majority:14, lastFought:2021, watchFor:'Reform UK targeting coastal and rural Norfolk. Con majority cushion is meaningful.',        verdict:'Reform advance',      difficulty:'medium'},
    {name:'North Yorkshire',    region:'Yorkshire',     type:'County',   control:'Con',  noc:false, seats:90,  majority:30, lastFought:2021, watchFor:'Large rural county. Con have a big majority — Reform would need a massive night.',         verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Nottinghamshire',    region:'East Midlands', type:'County',   control:'Con',  noc:false, seats:66,  majority:2,  lastFought:2021, watchFor:'Wafer-thin Con majority. Lab, Reform and Green all in play.',                             verdict:'Toss-up',             difficulty:'very hard'},
    {name:'Oxfordshire',        region:'South East',    type:'County',   control:'NOC',  noc:true,  seats:63,  majority:0,  lastFought:2021, watchFor:'No overall control. LD aiming for outright majority. Lab and Green competitive.',          verdict:'LD target majority',  difficulty:'medium'},
    {name:'Suffolk',            region:'East',          type:'County',   control:'Con',  noc:false, seats:75,  majority:14, lastFought:2021, watchFor:'Reform UK targeting Leave-heavy Suffolk. Con have a buffer but sentiment has shifted.',     verdict:'Reform advance',      difficulty:'medium'},
    {name:'Surrey',             region:'South East',    type:'County',   control:'Con',  noc:false, seats:80,  majority:30, lastFought:2021, watchFor:'LD Blue Wall territory. Con defending large majority won in better times.',                verdict:'LD advance',          difficulty:'medium'},
    {name:'Warwickshire',       region:'Midlands',      type:'County',   control:'Con',  noc:false, seats:62,  majority:4,  lastFought:2021, watchFor:'Very marginal. Lab and Reform both competitive with Con.',                                verdict:'Three-way marginal',  difficulty:'very hard'},
    {name:'West Sussex',        region:'South East',    type:'County',   control:'Con',  noc:false, seats:71,  majority:22, lastFought:2021, watchFor:'LD making inroads in coastal towns. Con majority large but from 2021 peak.',              verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Worcestershire',     region:'Midlands',      type:'County',   control:'Con',  noc:false, seats:57,  majority:14, lastFought:2021, watchFor:'Reform UK target. Leave-heavy county. Con defending comfortably but mood has shifted.',    verdict:'Reform advance',      difficulty:'medium'},
    {name:'East Sussex',        region:'South East',    type:'County',   control:'Con',  noc:false, seats:49,  majority:10, lastFought:2021, watchFor:'Reform targeting coastal seats — Hastings, Eastbourne. LD competitive in Lewes area.',     verdict:'Reform advance',      difficulty:'hard'},
    {name:'Buckinghamshire',    region:'South East',    type:'Unitary',  control:'Con',  noc:false, seats:98,  majority:40, lastFought:2021, watchFor:'Con stronghold. LD growing in Chesham and Amersham area after 2021 by-election legacy.',   verdict:'Con likely hold',     difficulty:'medium'},

    // ── DISTRICT/BOROUGH COUNCILS (under County Councils) ──────────

    // Cambridgeshire districts
    {name:'Cambridge City',     region:'East',          type:'District', control:'Lab',  noc:false, seats:42,  majority:14, lastFought:2022, watchFor:'Lab vs Green battle. Green strong in university wards. LD also competitive.',              verdict:'Lab defend',          difficulty:'medium'},
    {name:'East Cambridgeshire',region:'East',          type:'District', control:'Con',  noc:false, seats:39,  majority:12, lastFought:2022, watchFor:'Con stronghold. Reform could eat into majority in Fenland-adjacent areas.',               verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Fenland',            region:'East',          type:'District', control:'Con',  noc:false, seats:37,  majority:16, lastFought:2022, watchFor:'High Leave vote. Reform prime target district — could flip to Reform control.',           verdict:'Reform target',       difficulty:'very hard'},
    {name:'Huntingdonshire',    region:'East',          type:'District', control:'Con',  noc:false, seats:52,  majority:18, lastFought:2022, watchFor:'Reform making inroads. Con majority large but sentiment has shifted.',                    verdict:'Reform advance',      difficulty:'medium'},
    {name:'South Cambridgeshire',region:'East',         type:'District', control:'LD',   noc:false, seats:45,  majority:10, lastFought:2022, watchFor:'LD defending majority. Con squeezed. Green competitive in some wards.',                   verdict:'LD defend',           difficulty:'medium'},
    {name:'South Oxfordshire',  region:'South East',    type:'District', control:'LD',   noc:false, seats:48,  majority:8,  lastFought:2022, watchFor:'LD defending. Green competitive. Classic Blue Wall turned yellow territory.',              verdict:'LD defend',           difficulty:'medium'},
    {name:'Vale of White Horse',region:'South East',    type:'District', control:'LD',   noc:false, seats:38,  majority:6,  lastFought:2022, watchFor:'LD defending narrow majority. Con could recover here. Green also competitive.',            verdict:'LD marginal',         difficulty:'hard'},
    {name:'Cherwell',           region:'South East',    type:'District', control:'Con',  noc:false, seats:50,  majority:12, lastFought:2022, watchFor:'Con defending. Lab competitive in Banbury. Reform targeting rural wards.',                verdict:'Con defend',          difficulty:'medium'},
    {name:'West Oxfordshire',   region:'South East',    type:'District', control:'Con',  noc:false, seats:44,  majority:8,  lastFought:2022, watchFor:'Con vs LD battle. LD gained ground here in 2024 GE — council could follow.',             verdict:'LD target',           difficulty:'hard'},

    // Kent districts
    {name:'Ashford',            region:'South East',    type:'District', control:'Con',  noc:false, seats:44,  majority:14, lastFought:2022, watchFor:'Reform UK prime target. High Leave vote, ex-industrial towns.',                          verdict:'Reform target',       difficulty:'very hard'},
    {name:'Canterbury',         region:'South East',    type:'District', control:'Lab',  noc:false, seats:39,  majority:6,  lastFought:2022, watchFor:'Lab defending 2022 gain. Con recovery possible. Green strong in university wards.',       verdict:'Lab defend',          difficulty:'hard'},
    {name:'Dartford',           region:'South East',    type:'District', control:'Con',  noc:false, seats:44,  majority:20, lastFought:2022, watchFor:'Con stronghold. Reform could nibble at margins.',                                        verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Dover',              region:'South East',    type:'District', control:'Con',  noc:false, seats:44,  majority:6,  lastFought:2022, watchFor:'Reform surging. Leave-heavy port town. Could become first Reform-controlled district.',    verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Folkestone & Hythe', region:'South East',    type:'District', control:'Con',  noc:false, seats:40,  majority:8,  lastFought:2022, watchFor:'Reform strong in coastal towns. Con defending but outlook difficult.',                    verdict:'Reform target',       difficulty:'very hard'},
    {name:'Gravesham',          region:'South East',    type:'District', control:'Lab',  noc:false, seats:44,  majority:4,  lastFought:2022, watchFor:'Lab defending narrow majority. Reform and Con both competitive. Three-way race.',         verdict:'Lab marginal',        difficulty:'very hard'},
    {name:'Maidstone',          region:'South East',    type:'District', control:'Con',  noc:false, seats:55,  majority:10, lastFought:2022, watchFor:'Con vs Lab vs Reform battle. County town with mixed demographics.',                      verdict:'Three-way marginal',  difficulty:'hard'},
    {name:'Sevenoaks',          region:'South East',    type:'District', control:'Con',  noc:false, seats:54,  majority:30, lastFought:2022, watchFor:'Con stronghold. LD gaining in affluent commuter belt. Reform ceiling low.',              verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Swale',              region:'South East',    type:'District', control:'Con',  noc:false, seats:47,  majority:8,  lastFought:2022, watchFor:'Reform UK target. Sittingbourne area — high Leave vote, working-class coastal towns.',    verdict:'Reform target',       difficulty:'very hard'},
    {name:'Thanet',             region:'South East',    type:'District', control:'NOC',  noc:true,  seats:56,  majority:0,  lastFought:2022, watchFor:'Reform prime target. UKIP base in 2015. High deprivation, high Leave vote. Iconic.',      verdict:'Reform could take control',difficulty:'very hard'},
    {name:'Tonbridge & Malling',region:'South East',    type:'District', control:'Con',  noc:false, seats:54,  majority:24, lastFought:2022, watchFor:'Con stronghold. LD picking up votes but from low base.',                                 verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Tunbridge Wells',    region:'South East',    type:'District', control:'Con',  noc:false, seats:48,  majority:14, lastFought:2022, watchFor:'LD Blue Wall target. Affluent commuter town. Reform ceiling low.',                       verdict:'LD advance',          difficulty:'medium'},

    // Essex districts
    {name:'Basildon',           region:'East',          type:'District', control:'Con',  noc:false, seats:42,  majority:8,  lastFought:2022, watchFor:'Reform prime target. Basildon was UKIP ground in 2015. High Leave, ex-Labour area.',      verdict:'Reform target',       difficulty:'very hard'},
    {name:'Braintree',          region:'East',          type:'District', control:'Con',  noc:false, seats:60,  majority:20, lastFought:2022, watchFor:'Reform advance expected. Con majority large but Reform polling well in rural areas.',       verdict:'Reform advance',      difficulty:'medium'},
    {name:'Brentwood',          region:'East',          type:'District', control:'Con',  noc:false, seats:37,  majority:14, lastFought:2022, watchFor:'Con stronghold. Reform growing but affluent borough limits ceiling.',                      verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Castle Point',       region:'East',          type:'District', control:'Con',  noc:false, seats:41,  majority:10, lastFought:2022, watchFor:'Reform UK strong target. Canvey Island is UKIP/Reform heartland historically.',           verdict:'Reform target',       difficulty:'very hard'},
    {name:'Chelmsford',         region:'East',          type:'District', control:'Con',  noc:false, seats:58,  majority:16, lastFought:2022, watchFor:'Con vs LD. City of Chelmsford — growing professional class favouring LD.',               verdict:'LD advance',          difficulty:'medium'},
    {name:'Colchester',         region:'East',          type:'District', control:'LD',   noc:false, seats:60,  majority:6,  lastFought:2022, watchFor:'LD defending 2022 gain. Con recovery? Lab competitive in some wards.',                   verdict:'LD defend',           difficulty:'hard'},
    {name:'Epping Forest',      region:'East',          type:'District', control:'Con',  noc:false, seats:58,  majority:20, lastFought:2022, watchFor:'Reform targeting Leave voters in eastern areas. Con defending comfortably overall.',       verdict:'Reform advance',      difficulty:'medium'},
    {name:'Harlow',             region:'East',          type:'District', control:'Lab',  noc:false, seats:33,  majority:8,  lastFought:2022, watchFor:'Lab vs Reform battle. Harlow is a classic new town — Reform surge expected.',            verdict:'Lab must hold',       difficulty:'very hard'},
    {name:'Maldon',             region:'East',          type:'District', control:'Con',  noc:false, seats:31,  majority:14, lastFought:2022, watchFor:'Con stronghold. Reform advance likely but majority large.',                               verdict:'Reform advance',      difficulty:'medium'},
    {name:'Rochford',           region:'East',          type:'District', control:'Con',  noc:false, seats:39,  majority:14, lastFought:2022, watchFor:'Reform UK advancing. Southend adjacent — similar Leave demographics.',                    verdict:'Reform advance',      difficulty:'medium'},
    {name:'Tendring',           region:'East',          type:'District', control:'Con',  noc:false, seats:60,  majority:16, lastFought:2022, watchFor:'Clacton constituency — Reform MP already. Council a prime Reform target.',               verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Uttlesford',         region:'East',          type:'District', control:'Con',  noc:false, seats:44,  majority:14, lastFought:2022, watchFor:'LD growing in affluent rural area. Con defending from historically strong position.',      verdict:'LD advance',          difficulty:'medium'},

    // Hampshire districts
    {name:'Basingstoke & Deane',region:'South East',    type:'District', control:'Con',  noc:false, seats:60,  majority:12, lastFought:2022, watchFor:'Con vs Lab. Basingstoke has significant Labour vote. Reform also competing.',            verdict:'Con defend',          difficulty:'hard'},
    {name:'East Hampshire',     region:'South East',    type:'District', control:'Con',  noc:false, seats:44,  majority:20, lastFought:2022, watchFor:'Con stronghold. LD Blue Wall advance in affluent rural areas.',                          verdict:'LD advance',          difficulty:'medium'},
    {name:'Eastleigh',          region:'South East',    type:'District', control:'LD',   noc:false, seats:44,  majority:14, lastFought:2022, watchFor:'LD stronghold. Con and Reform both trailing significantly.',                             verdict:'LD safe',             difficulty:'safe'},
    {name:'Fareham',            region:'South East',    type:'District', control:'Con',  noc:false, seats:31,  majority:16, lastFought:2022, watchFor:'Con stronghold. Reform could advance but majority cushion is large.',                     verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Gosport',            region:'South East',    type:'District', control:'Con',  noc:false, seats:34,  majority:14, lastFought:2022, watchFor:'Reform UK advancing in ex-military coastal town. Con defending.',                        verdict:'Reform advance',      difficulty:'medium'},
    {name:'Hart',               region:'South East',    type:'District', control:'Con',  noc:false, seats:35,  majority:8,  lastFought:2022, watchFor:'LD Blue Wall advance. Fleet and Hook areas moving towards LD.',                          verdict:'LD target',           difficulty:'hard'},
    {name:'Havant',             region:'South East',    type:'District', control:'Con',  noc:false, seats:38,  majority:10, lastFought:2022, watchFor:'Reform target. Coastal working-class areas. Con defending but Reform polling strongly.',  verdict:'Reform target',       difficulty:'hard'},
    {name:'New Forest',         region:'South East',    type:'District', control:'Con',  noc:false, seats:60,  majority:18, lastFought:2022, watchFor:'Con defending. LD growing in Romsey area. Reform rural seats.',                          verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Rushmoor',           region:'South East',    type:'District', control:'Con',  noc:false, seats:39,  majority:10, lastFought:2022, watchFor:'Con vs Lab. Farnborough and Aldershot — army towns with mixed vote.',                   verdict:'Con defend',          difficulty:'medium'},
    {name:'Test Valley',        region:'South East',    type:'District', control:'Con',  noc:false, seats:48,  majority:22, lastFought:2022, watchFor:'Con stronghold. LD making modest inroads in western areas.',                             verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Winchester',         region:'South East',    type:'District', control:'LD',   noc:false, seats:57,  majority:8,  lastFought:2022, watchFor:'LD defending 2022 gain. Con recovery? Historic cathedral city turned LD.',               verdict:'LD defend',           difficulty:'medium'},

    // Norfolk & Suffolk districts
    {name:'Breckland',          region:'East',          type:'District', control:'Con',  noc:false, seats:54,  majority:20, lastFought:2022, watchFor:'Reform UK advance expected in Thetford and Dereham areas. Con majority large.',          verdict:'Reform advance',      difficulty:'medium'},
    {name:'Broadland',          region:'East',          type:'District', control:'Con',  noc:false, seats:47,  majority:16, lastFought:2022, watchFor:'Con stronghold. Reform nibbling at rural seats.',                                        verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Great Yarmouth',     region:'East',          type:'District', control:'Con',  noc:false, seats:39,  majority:8,  lastFought:2022, watchFor:'Reform prime target. Coastal deprivation, high Leave vote — Reform heartland.',         verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Kings Lynn & W. Norfolk',region:'East',      type:'District', control:'Con',  noc:false, seats:62,  majority:16, lastFought:2022, watchFor:'Reform advance expected. Leave-heavy Fenland-adjacent area.',                           verdict:'Reform advance',      difficulty:'medium'},
    {name:'North Norfolk',      region:'East',          type:'District', control:'LD',   noc:false, seats:48,  majority:10, lastFought:2022, watchFor:'LD defending. Reform advancing in coastal towns. Con squeezed.',                         verdict:'LD defend',           difficulty:'medium'},
    {name:'Norwich City',       region:'East',          type:'District', control:'Lab',  noc:false, seats:39,  majority:10, lastFought:2022, watchFor:'Lab vs Green battle in progressive city. Green performing strongly in some wards.',      verdict:'Lab defend',          difficulty:'medium'},
    {name:'South Norfolk',      region:'East',          type:'District', control:'Con',  noc:false, seats:46,  majority:16, lastFought:2022, watchFor:'Con stronghold. Reform advance in Wymondham and rural areas.',                           verdict:'Reform advance',      difficulty:'medium'},
    {name:'Babergh',            region:'East',          type:'District', control:'Con',  noc:false, seats:43,  majority:12, lastFought:2022, watchFor:'Con holding. Reform growing in rural Suffolk.',                                          verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Ipswich',            region:'East',          type:'District', control:'Lab',  noc:false, seats:48,  majority:10, lastFought:2022, watchFor:'Lab defending. Reform could advance in ex-working-class wards.',                         verdict:'Lab defend',          difficulty:'hard'},
    {name:'Mid Suffolk',        region:'East',          type:'District', control:'Con',  noc:false, seats:40,  majority:14, lastFought:2022, watchFor:'Con stronghold. Reform advance in rural areas.',                                         verdict:'Con likely hold',     difficulty:'medium'},
    {name:'East Suffolk',       region:'East',          type:'District', control:'Con',  noc:false, seats:55,  majority:18, lastFought:2022, watchFor:'Reform advancing in Lowestoft area — leave-heavy coastal town.',                        verdict:'Reform advance',      difficulty:'medium'},
    {name:'West Suffolk',       region:'East',          type:'District', control:'Con',  noc:false, seats:44,  majority:20, lastFought:2022, watchFor:'Con stronghold. Reform making inroads in Haverhill and Brandon.',                        verdict:'Con likely hold',     difficulty:'medium'},

    // Hertfordshire districts
    {name:'Broxbourne',         region:'East',          type:'District', control:'Con',  noc:false, seats:38,  majority:18, lastFought:2022, watchFor:'Con stronghold. Reform advance in Waltham Cross area.',                                  verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Dacorum',            region:'East',          type:'District', control:'Con',  noc:false, seats:58,  majority:20, lastFought:2022, watchFor:'Con vs LD. Hemel Hempstead area — LD making inroads.',                                 verdict:'Con likely hold',     difficulty:'medium'},
    {name:'East Hertfordshire', region:'East',          type:'District', control:'Con',  noc:false, seats:50,  majority:22, lastFought:2022, watchFor:'Con stronghold. LD advance in Bishop\'s Stortford area.',                               verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Hertsmere',          region:'East',          type:'District', control:'Con',  noc:false, seats:39,  majority:18, lastFought:2022, watchFor:'Con stronghold. Lab making inroads in Borehamwood.',                                     verdict:'Con likely hold',     difficulty:'medium'},
    {name:'North Hertfordshire',region:'East',          type:'District', control:'Con',  noc:false, seats:47,  majority:12, lastFought:2022, watchFor:'Con vs LD battle. Hitchin and Royston — LD growing.',                                   verdict:'LD advance',          difficulty:'medium'},
    {name:'St Albans',          region:'East',          type:'District', control:'LD',   noc:false, seats:58,  majority:14, lastFought:2022, watchFor:'LD stronghold. Lab competitive in city wards. Con squeezed.',                            verdict:'LD safe',             difficulty:'safe'},
    {name:'Stevenage',          region:'East',          type:'District', control:'Lab',  noc:false, seats:39,  majority:14, lastFought:2022, watchFor:'Lab stronghold. Reform advance in Bedwell and Shephall estates.',                        verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Three Rivers',       region:'East',          type:'District', control:'LD',   noc:false, seats:48,  majority:18, lastFought:2022, watchFor:'LD stronghold. Con squeezed. Very affluent area, Reform ceiling low.',                   verdict:'LD safe',             difficulty:'safe'},
    {name:'Watford',            region:'East',          type:'District', control:'Lab',  noc:false, seats:36,  majority:8,  lastFought:2022, watchFor:'Lab defending. Con and LD both competitive. Diverse town.',                              verdict:'Lab defend',          difficulty:'medium'},
    {name:'Welwyn Hatfield',    region:'East',          type:'District', control:'Con',  noc:false, seats:48,  majority:12, lastFought:2022, watchFor:'Con defending. Lab competitive in Hatfield wards.',                                      verdict:'Con defend',          difficulty:'medium'},

    // Lincolnshire districts
    {name:'Boston',             region:'East Midlands', type:'District', control:'Con',  noc:false, seats:33,  majority:6,  lastFought:2022, watchFor:'Reform prime target. Highest Leave vote in UK 2016. Symbolic borough.',                 verdict:'Reform could take control',difficulty:'very hard'},
    {name:'East Lindsey',       region:'East Midlands', type:'District', control:'Con',  noc:false, seats:55,  majority:16, lastFought:2022, watchFor:'Reform advancing in Skegness and coastal towns.',                                        verdict:'Reform advance',      difficulty:'hard'},
    {name:'Lincoln City',       region:'East Midlands', type:'District', control:'Lab',  noc:false, seats:33,  majority:8,  lastFought:2022, watchFor:'Lab defending. Reform advance in outer estates.',                                        verdict:'Lab defend',          difficulty:'hard'},
    {name:'North Kesteven',     region:'East Midlands', type:'District', control:'Con',  noc:false, seats:43,  majority:18, lastFought:2022, watchFor:'Con stronghold. Reform advance in Sleaford area.',                                       verdict:'Con likely hold',     difficulty:'medium'},
    {name:'South Holland',      region:'East Midlands', type:'District', control:'Con',  noc:false, seats:37,  majority:20, lastFought:2022, watchFor:'Reform UK target. Spalding — extremely high Leave vote.',                               verdict:'Reform target',       difficulty:'hard'},
    {name:'South Kesteven',     region:'East Midlands', type:'District', control:'Con',  noc:false, seats:58,  majority:24, lastFought:2022, watchFor:'Con stronghold. Grantham included — Reform advance expected.',                           verdict:'Con likely hold',     difficulty:'medium'},
    {name:'West Lindsey',       region:'East Midlands', type:'District', control:'Con',  noc:false, seats:37,  majority:14, lastFought:2022, watchFor:'Reform advancing. Rural Lincolnshire — Gainsborough area.',                              verdict:'Reform advance',      difficulty:'medium'},

    // Nottinghamshire districts
    {name:'Ashfield',           region:'East Midlands', type:'District', control:'Ind',  noc:false, seats:35,  majority:6,  lastFought:2022, watchFor:'Independent stronghold. Reform challenging hard. Former mining area.',                   verdict:'Toss-up',             difficulty:'very hard'},
    {name:'Basford',            region:'East Midlands', type:'District', control:'Lab',  noc:false, seats:36,  majority:10, lastFought:2022, watchFor:'Lab defending. Reform advancing in ex-mining communities.',                              verdict:'Lab defend',          difficulty:'hard'},
    {name:'Broxtowe',           region:'East Midlands', type:'District', control:'Con',  noc:false, seats:44,  majority:4,  lastFought:2022, watchFor:'Wafer-thin Con majority. Lab and Reform both competitive.',                             verdict:'Three-way marginal',  difficulty:'very hard'},
    {name:'Gedling',            region:'East Midlands', type:'District', control:'Lab',  noc:false, seats:46,  majority:8,  lastFought:2022, watchFor:'Lab defending. Con recovery attempt. Reform advance likely.',                            verdict:'Lab defend',          difficulty:'hard'},
    {name:'Mansfield',          region:'East Midlands', type:'District', control:'Ind',  noc:false, seats:36,  majority:8,  lastFought:2022, watchFor:'Ind defending. Reform surging. Mansfield was first Tory gain from Lab in 2017.',        verdict:'Reform target',       difficulty:'very hard'},
    {name:'Newark & Sherwood',  region:'East Midlands', type:'District', control:'Con',  noc:false, seats:50,  majority:14, lastFought:2022, watchFor:'Con defending. Reform advance in rural areas.',                                          verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Rushcliffe',         region:'East Midlands', type:'District', control:'Con',  noc:false, seats:50,  majority:16, lastFought:2022, watchFor:'Con vs Lab. West Bridgford — affluent suburb. LD also competitive.',                    verdict:'Con defend',          difficulty:'medium'},
    {name:'Selby',              region:'Yorkshire',     type:'District', control:'Con',  noc:false, seats:41,  majority:8,  lastFought:2022, watchFor:'Con defending. Lab competitive. Reform targeting ex-mining communities.',                 verdict:'Three-way marginal',  difficulty:'hard'},

    // Leicestershire districts
    {name:'Blaby',              region:'East Midlands', type:'District', control:'Con',  noc:false, seats:35,  majority:12, lastFought:2022, watchFor:'Con stronghold. Reform advance in Leicester suburban areas.',                             verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Charnwood',          region:'East Midlands', type:'District', control:'Con',  noc:false, seats:52,  majority:14, lastFought:2022, watchFor:'Con vs Lab. Loughborough university town — Lab competitive.',                            verdict:'Con defend',          difficulty:'medium'},
    {name:'Harborough',         region:'East Midlands', type:'District', control:'Con',  noc:false, seats:37,  majority:16, lastFought:2022, watchFor:'Con stronghold. LD growing in Market Harborough area.',                                  verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Hinckley & Bosworth',region:'East Midlands', type:'District', control:'Con',  noc:false, seats:34,  majority:8,  lastFought:2022, watchFor:'Con defending. Reform advance in Hinckley ex-industrial areas.',                        verdict:'Reform advance',      difficulty:'medium'},
    {name:'Melton',             region:'East Midlands', type:'District', control:'Con',  noc:false, seats:28,  majority:12, lastFought:2022, watchFor:'Con stronghold. Small rural council. Reform advance limited.',                           verdict:'Con likely hold',     difficulty:'medium'},
    {name:'North West Leics',   region:'East Midlands', type:'District', control:'Con',  noc:false, seats:38,  majority:6,  lastFought:2022, watchFor:'Con defending narrow majority. Lab and Reform both competitive.',                        verdict:'Three-way marginal',  difficulty:'hard'},
    {name:'Oadby & Wigston',    region:'East Midlands', type:'District', control:'LD',   noc:false, seats:26,  majority:8,  lastFought:2022, watchFor:'LD defending. Lab competitive in diverse Leicester suburban area.',                      verdict:'LD defend',           difficulty:'medium'},

    // Warwickshire districts
    {name:'North Warwickshire', region:'Midlands',      type:'District', control:'Con',  noc:false, seats:34,  majority:4,  lastFought:2022, watchFor:'Reform prime target. Atherstone area — ex-mining, high Leave. Very marginal.',         verdict:'Reform could take control',difficulty:'very hard'},
    {name:'Nuneaton & Bedworth',region:'Midlands',      type:'District', control:'Con',  noc:false, seats:34,  majority:2,  lastFought:2022, watchFor:'Most marginal council in Warwickshire. Lab, Reform and Con all in contention.',         verdict:'Toss-up',             difficulty:'very hard'},
    {name:'Rugby',              region:'Midlands',      type:'District', control:'Con',  noc:false, seats:42,  majority:8,  lastFought:2022, watchFor:'Con defending. Lab competitive in town wards. Reform rural advance.',                    verdict:'Con defend',          difficulty:'medium'},
    {name:'Stratford-on-Avon', region:'Midlands',      type:'District', control:'Con',  noc:false, seats:51,  majority:20, lastFought:2022, watchFor:'Con stronghold. LD growing in leafy south Warwickshire.',                               verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Warwick',            region:'Midlands',      type:'District', control:'Lab',  noc:false, seats:46,  majority:8,  lastFought:2022, watchFor:'Lab defending. Con and LD competitive. University town dynamics.',                       verdict:'Lab defend',          difficulty:'medium'},

    // Worcestershire districts
    {name:'Bromsgrove',         region:'Midlands',      type:'District', control:'Con',  noc:false, seats:38,  majority:14, lastFought:2022, watchFor:'Reform UK advancing. Ex-industrial areas around Redditch border.',                      verdict:'Reform advance',      difficulty:'medium'},
    {name:'Malvern Hills',      region:'Midlands',      type:'District', control:'Con',  noc:false, seats:38,  majority:10, lastFought:2022, watchFor:'Con defending. LD growing in Malvern town. Reform rural.',                              verdict:'Con defend',          difficulty:'medium'},
    {name:'Redditch',           region:'Midlands',      type:'District', control:'Con',  noc:false, seats:29,  majority:4,  lastFought:2022, watchFor:'Reform prime target. Town known for bellwether politics. Very marginal.',               verdict:'Reform target',       difficulty:'very hard'},
    {name:'Worcester City',     region:'Midlands',      type:'District', control:'Lab',  noc:false, seats:35,  majority:6,  lastFought:2022, watchFor:'Lab defending. Con and Reform both competitive.',                                        verdict:'Lab defend',          difficulty:'hard'},
    {name:'Wychavon',           region:'Midlands',      type:'District', control:'Con',  noc:false, seats:45,  majority:20, lastFought:2022, watchFor:'Con stronghold. Evesham area — Reform limited ceiling.',                               verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Wyre Forest',        region:'Midlands',      type:'District', control:'Con',  noc:false, seats:42,  majority:6,  lastFought:2022, watchFor:'Reform target. Kidderminster — UKIP had MP here in 2001. Historical protest vote area.',verdict:'Reform target',       difficulty:'very hard'},

    // ── METROPOLITAN BOROUGHS (1/3 seats up) ───────────────────────
    // Greater Manchester
    {name:'Bolton',             region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:60,  majority:20, lastFought:2023, watchFor:'Reform targeting working-class ex-mill towns. Lab defending comfortably.',               verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Bury',               region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:51,  majority:14, lastFought:2023, watchFor:'Lab defending. Reform advance in Radcliffe and Ramsbottom areas.',                      verdict:'Lab defend',          difficulty:'medium'},
    {name:'Manchester City',    region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:96,  majority:60, lastFought:2023, watchFor:'Lab dominant. Green competitive in Didsbury and Withington.',                            verdict:'Lab safe',            difficulty:'safe'},
    {name:'Oldham',             region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:60,  majority:18, lastFought:2023, watchFor:'Lab vs Reform. Ex-textile town with high Leave vote. Potentially tight.',               verdict:'Lab defend',          difficulty:'hard'},
    {name:'Rochdale',           region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:60,  majority:16, lastFought:2023, watchFor:'Lab defending. Reform and Ind. competition. Galloway-era politics.',                    verdict:'Lab defend',          difficulty:'hard'},
    {name:'Salford',            region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:60,  majority:30, lastFought:2023, watchFor:'Lab stronghold. Reform limited ceiling. Media City changing demographics.',              verdict:'Lab safe',            difficulty:'safe'},
    {name:'Stockport',          region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:63,  majority:14, lastFought:2023, watchFor:'Lab vs LD battle. LD Blue Wall advance in Bramhall and Cheadle.',                      verdict:'LD advance',          difficulty:'medium'},
    {name:'Tameside',           region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:57,  majority:22, lastFought:2023, watchFor:'Lab stronghold. Reform advancing in Hyde and Stalybridge.',                             verdict:'Lab defend',          difficulty:'medium'},
    {name:'Trafford',           region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:63,  majority:10, lastFought:2023, watchFor:'Lab defending 2022 gain. Con recovery? LD competitive in Sale.',                       verdict:'Lab defend',          difficulty:'hard'},
    {name:'Wigan',              region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:75,  majority:40, lastFought:2023, watchFor:'Lab fortress. Reform making inroads in mining communities.',                            verdict:'Lab safe',            difficulty:'safe'},

    // Merseyside
    {name:'Knowsley',           region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:45,  majority:36, lastFought:2023, watchFor:'Lab\'s safest council. Reform growing but from very low base.',                         verdict:'Lab safe',            difficulty:'safe'},
    {name:'Liverpool',          region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:90,  majority:60, lastFought:2023, watchFor:'Lab dominant. Green and LD competitive in central wards.',                               verdict:'Lab safe',            difficulty:'safe'},
    {name:'Sefton',             region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:66,  majority:24, lastFought:2023, watchFor:'Lab defending. Con competitive in Southport and Formby.',                               verdict:'Lab defend',          difficulty:'medium'},
    {name:'St Helens',          region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:48,  majority:28, lastFought:2023, watchFor:'Lab stronghold. Reform advancing in Thatto Heath and Haydock.',                         verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Wirral',             region:'North West',    type:'Metropolitan', control:'Lab',  noc:false, seats:66,  majority:16, lastFought:2023, watchFor:'Lab vs Con. Birkenhead Lab, Heswall Con. Reform a wildcard.',                           verdict:'Lab defend',          difficulty:'medium'},

    // West Yorkshire
    {name:'Bradford',           region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:90,  majority:24, lastFought:2023, watchFor:'Lab defending. Green and Reform competition. Galloway effect — diverse electorate.',      verdict:'Lab defend',          difficulty:'hard'},
    {name:'Calderdale',         region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:51,  majority:12, lastFought:2023, watchFor:'Lab defending. Con competitive in Calder Valley. Green in Halifax.',                     verdict:'Lab defend',          difficulty:'medium'},
    {name:'Kirklees',           region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:69,  majority:16, lastFought:2023, watchFor:'Lab vs Con. Huddersfield Lab, Mirfield Con. Reform competing.',                         verdict:'Lab defend',          difficulty:'medium'},
    {name:'Leeds',              region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:99,  majority:36, lastFought:2023, watchFor:'Lab dominant. Green competitive in Headingley. Reform in outer estates.',               verdict:'Lab safe',            difficulty:'safe'},
    {name:'Wakefield',          region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:63,  majority:28, lastFought:2023, watchFor:'Lab stronghold. Reform advancing in ex-mining communities around Pontefract.',           verdict:'Lab defend',          difficulty:'medium'},

    // South Yorkshire
    {name:'Barnsley',           region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:63,  majority:36, lastFought:2023, watchFor:'Lab fortress. Reform growing but from low base in ex-mining town.',                     verdict:'Lab safe',            difficulty:'safe'},
    {name:'Doncaster',          region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:55,  majority:10, lastFought:2023, watchFor:'Traditional Labour heartland. Reform polling strongly. Symbolic seat.',                  verdict:'Lab must hold',       difficulty:'hard'},
    {name:'Rotherham',          region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:63,  majority:24, lastFought:2023, watchFor:'Lab defending. Reform targeting ex-steel communities. UKIP had seats here.',             verdict:'Lab defend',          difficulty:'hard'},
    {name:'Sheffield',          region:'Yorkshire',     type:'Metropolitan', control:'Lab',  noc:false, seats:84,  majority:28, lastFought:2023, watchFor:'Lab vs LD vs Green. Hallam area LD. Greens competitive in student wards.',              verdict:'Lab defend',          difficulty:'medium'},

    // West Midlands
    {name:'Birmingham',         region:'Midlands',      type:'Metropolitan', control:'Lab',  noc:false, seats:101, majority:20, lastFought:2023, watchFor:'Lab defending. Effective bankruptcy context. Reform and Con both competitive.',          verdict:'Lab defend',          difficulty:'hard'},
    {name:'Coventry',           region:'Midlands',      type:'Metropolitan', control:'Lab',  noc:false, seats:54,  majority:22, lastFought:2023, watchFor:'Lab stronghold. Reform advancing in ex-manufacturing areas.',                            verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Dudley',             region:'Midlands',      type:'Metropolitan', control:'Con',  noc:false, seats:72,  majority:6,  lastFought:2023, watchFor:'Con defending narrow majority. Reform and Lab both in contention.',                      verdict:'Three-way marginal',  difficulty:'very hard'},
    {name:'Sandwell',           region:'Midlands',      type:'Metropolitan', control:'Lab',  noc:false, seats:72,  majority:32, lastFought:2023, watchFor:'Lab dominant. Reform growing in West Bromwich area.',                                    verdict:'Lab safe',            difficulty:'safe'},
    {name:'Solihull',           region:'Midlands',      type:'Metropolitan', control:'Con',  noc:false, seats:51,  majority:14, lastFought:2023, watchFor:'Con defending. LD making inroads in affluent suburbs.',                                  verdict:'Con defend',          difficulty:'medium'},
    {name:'Walsall',            region:'Midlands',      type:'Metropolitan', control:'Lab',  noc:false, seats:60,  majority:10, lastFought:2023, watchFor:'Lab defending marginal majority. Reform targeting working-class wards.',                  verdict:'Lab marginal',        difficulty:'hard'},
    {name:'Wolverhampton',      region:'Midlands',      type:'Metropolitan', control:'Lab',  noc:false, seats:60,  majority:24, lastFought:2023, watchFor:'Lab stronghold. Reform advance expected but Lab majority comfortable.',                   verdict:'Lab likely hold',     difficulty:'medium'},

    // Tyne & Wear
    {name:'Gateshead',          region:'North East',    type:'Metropolitan', control:'Lab',  noc:false, seats:66,  majority:34, lastFought:2023, watchFor:'Lab fortress. Reform advance from low base.',                                            verdict:'Lab safe',            difficulty:'safe'},
    {name:'Newcastle',          region:'North East',    type:'Metropolitan', control:'Lab',  noc:false, seats:78,  majority:36, lastFought:2023, watchFor:'Lab dominant. Green and LD competitive in Jesmond and Gosforth.',                        verdict:'Lab safe',            difficulty:'safe'},
    {name:'North Tyneside',     region:'North East',    type:'Metropolitan', control:'Lab',  noc:false, seats:60,  majority:24, lastFought:2023, watchFor:'Lab defending. Con competitive in coastal areas. Reform also.',                          verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'South Tyneside',     region:'North East',    type:'Metropolitan', control:'Lab',  noc:false, seats:54,  majority:30, lastFought:2023, watchFor:'Lab fortress. Reform limited ceiling in traditional Labour territory.',                   verdict:'Lab safe',            difficulty:'safe'},
    {name:'Sunderland',         region:'North East',    type:'Metropolitan', control:'Lab',  noc:false, seats:75,  majority:30, lastFought:2023, watchFor:'Lab stronghold. Reform targeting ex-shipbuilding communities.',                          verdict:'Lab defend',          difficulty:'medium'},

    // ── UNITARY AUTHORITIES ─────────────────────────────────────────
    {name:'Durham',             region:'North East',    type:'Unitary',  control:'Lab',  noc:false, seats:63,  majority:8,  lastFought:2021, watchFor:'Reform UK made gains at GE2024. Council would be a landmark gain.',                     verdict:'Reform target',       difficulty:'hard'},
    {name:'Northumberland',     region:'North East',    type:'Unitary',  control:'Con',  noc:false, seats:67,  majority:4,  lastFought:2021, watchFor:'Reform vs Lab vs Con three-way. Marginal council in marginal region.',                   verdict:'Three-way marginal',  difficulty:'very hard'},
    {name:'Somerset',           region:'South West',    type:'Unitary',  control:'LD',   noc:false, seats:55,  majority:12, lastFought:2021, watchFor:'LD defending majority. Green competition. Con squeezed.',                               verdict:'LD defend',           difficulty:'medium'},
    {name:'Cornwall',           region:'South West',    type:'Unitary',  control:'NOC',  noc:true,  seats:87,  majority:0,  lastFought:2021, watchFor:'No overall control. LD, Lab, Con and Ind all in play. Reform making inroads.',           verdict:'Toss-up',             difficulty:'hard'},
    {name:'Wiltshire',          region:'South West',    type:'Unitary',  control:'Con',  noc:false, seats:98,  majority:26, lastFought:2021, watchFor:'Con stronghold. LD Blue Wall advance in Chippenham and Devizes.',                        verdict:'LD advance',          difficulty:'medium'},
    {name:'Bath & NE Somerset', region:'South West',    type:'Unitary',  control:'LD',   noc:false, seats:65,  majority:18, lastFought:2021, watchFor:'LD stronghold. Green competitive. Con squeezed in university city.',                     verdict:'LD safe',             difficulty:'safe'},
    {name:'South Gloucestershire',region:'South West',  type:'Unitary',  control:'Con',  noc:false, seats:70,  majority:14, lastFought:2021, watchFor:'Con vs LD. Thornbury area moving LD. Reform limited in affluent suburb.',               verdict:'LD advance',          difficulty:'medium'},
    {name:'Bristol City',       region:'South West',    type:'Unitary',  control:'Lab',  noc:false, seats:70,  majority:14, lastFought:2021, watchFor:'Lab vs Green vs LD. Green very competitive in Clifton and Cotham.',                     verdict:'Lab defend',          difficulty:'hard'},
    {name:'North Somerset',     region:'South West',    type:'Unitary',  control:'Con',  noc:false, seats:61,  majority:12, lastFought:2021, watchFor:'LD Blue Wall advance. Weston-super-Mare Con, but surrounds moving LD.',                 verdict:'LD target',           difficulty:'hard'},
    {name:'Swindon',            region:'South West',    type:'Unitary',  control:'Con',  noc:false, seats:57,  majority:14, lastFought:2021, watchFor:'Reform advancing in ex-manufacturing areas. Con vs Lab vs Reform.',                     verdict:'Reform advance',      difficulty:'hard'},
    {name:'Plymouth',           region:'South West',    type:'Unitary',  control:'Lab',  noc:false, seats:57,  majority:8,  lastFought:2021, watchFor:'Lab defending marginal. Con and Reform both competitive in naval city.',               verdict:'Lab marginal',        difficulty:'very hard'},
    {name:'Torbay',             region:'South West',    type:'Unitary',  control:'Con',  noc:false, seats:36,  majority:6,  lastFought:2021, watchFor:'Reform target. Torquay coastal deprivation — high Leave vote.',                        verdict:'Reform target',       difficulty:'hard'},
    {name:'Reading',            region:'South East',    type:'Unitary',  control:'Lab',  noc:false, seats:46,  majority:14, lastFought:2021, watchFor:'Lab stronghold. LD competitive in central wards. Green growing.',                       verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Slough',             region:'South East',    type:'Unitary',  control:'Lab',  noc:false, seats:42,  majority:16, lastFought:2021, watchFor:'Lab defending. Diverse borough. Reform limited ceiling.',                               verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'West Berkshire',     region:'South East',    type:'Unitary',  control:'Con',  noc:false, seats:52,  majority:14, lastFought:2021, watchFor:'Con stronghold. LD growing in Newbury area after 2024 GE gain.',                       verdict:'LD advance',          difficulty:'medium'},
    {name:'Windsor & Maidenhead',region:'South East',   type:'Unitary',  control:'Con',  noc:false, seats:57,  majority:28, lastFought:2021, watchFor:'Con stronghold. LD making limited inroads. Reform ceiling low.',                        verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Wokingham',          region:'South East',    type:'Unitary',  control:'Con',  noc:false, seats:54,  majority:16, lastFought:2021, watchFor:'LD Blue Wall advance. Wokingham LD since 2024 GE — council to follow?',               verdict:'LD target',           difficulty:'hard'},
    {name:'Bracknell Forest',   region:'South East',    type:'Unitary',  control:'Con',  noc:false, seats:42,  majority:16, lastFought:2021, watchFor:'Con defending. Reform advance in town areas.',                                          verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Medway',             region:'South East',    type:'Unitary',  control:'Con',  noc:false, seats:55,  majority:10, lastFought:2021, watchFor:'Reform prime target. Rochester and Chatham — high Leave, ex-industrial.',              verdict:'Reform target',       difficulty:'very hard'},
    {name:'Folkestone & Hythe UA',region:'South East',  type:'Unitary',  control:'Con',  noc:false, seats:40,  majority:8,  lastFought:2021, watchFor:'Reform targeting coastal towns — Folkestone particularly deprived.',                   verdict:'Reform advance',      difficulty:'hard'},
    {name:'Milton Keynes',      region:'South East',    type:'Unitary',  control:'Lab',  noc:false, seats:57,  majority:10, lastFought:2021, watchFor:'Lab defending. Con and LD competitive. Fast-growing diverse new city.',                verdict:'Lab defend',          difficulty:'medium'},
    {name:'Luton',              region:'East',          type:'Unitary',  control:'Lab',  noc:false, seats:48,  majority:22, lastFought:2021, watchFor:'Lab stronghold. Diverse borough. Reform limited ceiling.',                              verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Bedford',            region:'East',          type:'Unitary',  control:'Lab',  noc:false, seats:42,  majority:8,  lastFought:2021, watchFor:'Lab defending. Con competitive. Reform also present.',                                  verdict:'Lab defend',          difficulty:'medium'},
    {name:'Central Bedfordshire',region:'East',         type:'Unitary',  control:'Con',  noc:false, seats:69,  majority:28, lastFought:2021, watchFor:'Con stronghold. Reform advance in Leave-heavy Dunstable area.',                        verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Peterborough',       region:'East',          type:'Unitary',  control:'Con',  noc:false, seats:57,  majority:6,  lastFought:2021, watchFor:'Reform prime target. 2019 by-election Leave battleground. Very high Leave vote.',     verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Southend-on-Sea',    region:'East',          type:'Unitary',  control:'Con',  noc:false, seats:51,  majority:10, lastFought:2021, watchFor:'Reform advancing. Coastal Essex — high Leave vote. Lab also competitive.',             verdict:'Reform target',       difficulty:'hard'},
    {name:'Thurrock',           region:'East',          type:'Unitary',  control:'Con',  noc:false, seats:49,  majority:6,  lastFought:2021, watchFor:'Reform prime target. Thurrock known for UKIP/Brexit strength.',                       verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Stockton-on-Tees',   region:'North East',    type:'Unitary',  control:'Lab',  noc:false, seats:56,  majority:14, lastFought:2021, watchFor:'Lab defending. Reform advance in Billingham and Thornaby.',                            verdict:'Lab defend',          difficulty:'hard'},
    {name:'Middlesbrough',      region:'North East',    type:'Unitary',  control:'Lab',  noc:false, seats:46,  majority:12, lastFought:2021, watchFor:'Lab stronghold. Reform advancing in ex-industrial areas.',                            verdict:'Lab defend',          difficulty:'medium'},
    {name:'Redcar & Cleveland', region:'North East',    type:'Unitary',  control:'Lab',  noc:false, seats:59,  majority:8,  lastFought:2021, watchFor:'Reform target. Redcar — iconic seat lost to Con in 2019. Very tight.',               verdict:'Reform target',       difficulty:'very hard'},
    {name:'Hartlepool',         region:'North East',    type:'Unitary',  control:'Con',  noc:false, seats:33,  majority:4,  lastFought:2021, watchFor:'Reform prime target. 2021 by-election landmark — Reform will fight hard here.',       verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Darlington',         region:'North East',    type:'Unitary',  control:'Lab',  noc:false, seats:50,  majority:8,  lastFought:2021, watchFor:'Lab defending. Reform and Con both competitive. Bellwether town.',                    verdict:'Three-way marginal',  difficulty:'very hard'},
    {name:'York',               region:'Yorkshire',     type:'Unitary',  control:'Lab',  noc:false, seats:47,  majority:10, lastFought:2021, watchFor:'Lab defending. LD and Green competitive in historic university city.',                 verdict:'Lab defend',          difficulty:'medium'},
    {name:'East Riding of Yorks',region:'Yorkshire',    type:'Unitary',  control:'Con',  noc:false, seats:67,  majority:16, lastFought:2021, watchFor:'Con stronghold. Reform advancing in Beverley and coastal areas.',                     verdict:'Reform advance',      difficulty:'medium'},
    {name:'Kingston upon Hull', region:'Yorkshire',     type:'Unitary',  control:'Lab',  noc:false, seats:59,  majority:20, lastFought:2021, watchFor:'Lab stronghold. Reform advance expected in ex-fishing port communities.',             verdict:'Lab defend',          difficulty:'medium'},
    {name:'East Riding',        region:'Yorkshire',     type:'Unitary',  control:'Con',  noc:false, seats:67,  majority:16, lastFought:2021, watchFor:'Con stronghold. Reform advancing along coast.',                                        verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Cheshire East',      region:'North West',    type:'Unitary',  control:'Lab',  noc:false, seats:82,  majority:8,  lastFought:2021, watchFor:'Lab defending narrow majority. Con and LD both competitive in affluent Cheshire.',    verdict:'Three-way marginal',  difficulty:'very hard'},
    {name:'Cheshire West & Chester',region:'North West',type:'Unitary',  control:'Lab',  noc:false, seats:75,  majority:14, lastFought:2021, watchFor:'Lab defending. Con competitive. Reform advance in Chester and Ellesmere Port.',      verdict:'Lab defend',          difficulty:'hard'},
    {name:'Halton',             region:'North West',    type:'Unitary',  control:'Lab',  noc:false, seats:57,  majority:28, lastFought:2021, watchFor:'Lab stronghold. Reform advance in Runcorn and Widnes.',                              verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Warrington',         region:'North West',    type:'Unitary',  control:'Lab',  noc:false, seats:58,  majority:14, lastFought:2021, watchFor:'Lab defending. Con and Reform competitive in new town. Bellwether authority.',        verdict:'Lab defend',          difficulty:'hard'},
    {name:'Blackpool',          region:'North West',    type:'Unitary',  control:'Lab',  noc:false, seats:42,  majority:8,  lastFought:2021, watchFor:'Reform prime target. Coastal deprivation, high Leave vote, tourism decline.',        verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Blackburn with Darwen',region:'North West',  type:'Unitary',  control:'Lab',  noc:false, seats:64,  majority:20, lastFought:2021, watchFor:'Lab defending. Diverse borough. Reform limited ceiling.',                             verdict:'Lab defend',          difficulty:'medium'},
    {name:'Preston',            region:'North West',    type:'Unitary',  control:'Lab',  noc:false, seats:57,  majority:16, lastFought:2021, watchFor:'Lab stronghold. Reform advance limited by diverse electorate.',                       verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Shropshire',         region:'Midlands',      type:'Unitary',  control:'Con',  noc:false, seats:74,  majority:20, lastFought:2021, watchFor:'Con stronghold. Reform advance in rural areas. LD in Ludlow.',                       verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Telford & Wrekin',   region:'Midlands',      type:'Unitary',  control:'Lab',  noc:false, seats:54,  majority:8,  lastFought:2021, watchFor:'Lab defending. Reform target. New town — former steel and manufacturing area.',      verdict:'Reform target',       difficulty:'hard'},
    {name:'Herefordshire',      region:'Midlands',      type:'Unitary',  control:'Con',  noc:false, seats:58,  majority:14, lastFought:2021, watchFor:'Con stronghold. Ind and LD competitive in rural wards.',                             verdict:'Con likely hold',     difficulty:'medium'},
    {name:'Stoke-on-Trent',     region:'Midlands',      type:'Unitary',  control:'Lab',  noc:false, seats:44,  majority:4,  lastFought:2021, watchFor:'Reform prime target. Stoke voted most strongly Leave in 2016. Iconic battleground.',  verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Derby City',         region:'East Midlands', type:'Unitary',  control:'Lab',  noc:false, seats:51,  majority:8,  lastFought:2021, watchFor:'Lab defending. Con and Reform both competitive.',                                     verdict:'Lab defend',          difficulty:'hard'},
    {name:'Nottingham City',    region:'East Midlands', type:'Unitary',  control:'Lab',  noc:false, seats:55,  majority:22, lastFought:2021, watchFor:'Lab stronghold. Green competitive in Lenton and university wards.',                   verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Leicester City',     region:'East Midlands', type:'Unitary',  control:'Lab',  noc:false, seats:54,  majority:20, lastFought:2021, watchFor:'Lab stronghold. Diverse city. Reform very limited ceiling.',                          verdict:'Lab likely hold',     difficulty:'medium'},
    {name:'Rutland',            region:'East Midlands', type:'Unitary',  control:'Con',  noc:false, seats:26,  majority:8,  lastFought:2021, watchFor:'Con stronghold. Smallest unitary authority. LD growing modestly.',                    verdict:'Con likely hold',     difficulty:'medium'},

    // ── LONDON BOROUGHS (all seats up) ─────────────────────────────
    {name:'Barking & Dagenham', region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:51,  majority:22, lastFought:2022, watchFor:'Reform prime target. High Leave, working-class. UKIP had councillors here.',        verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Barnet',             region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:63,  majority:16, lastFought:2022, watchFor:'Lab defending 2022 gain. Con recovery attempt. Diverse north London borough.',       verdict:'Lab defend',           difficulty:'hard'},
    {name:'Bexley',             region:'London',        type:'London Borough', control:'Con',  noc:false, seats:63,  majority:20, lastFought:2022, watchFor:'Reform advancing in outer south-east London. Con defending from 2021 peak.',         verdict:'Reform advance',       difficulty:'hard'},
    {name:'Brent',              region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:63,  majority:40, lastFought:2022, watchFor:'Lab fortress. Diverse borough — Wembley, Harlesden. Reform ceiling very low.',       verdict:'Lab safe',             difficulty:'safe'},
    {name:'Bromley',            region:'London',        type:'London Borough', control:'Con',  noc:false, seats:60,  majority:22, lastFought:2022, watchFor:'Con stronghold. LD making modest inroads in Crystal Palace fringe.',                 verdict:'Con likely hold',      difficulty:'medium'},
    {name:'Camden',             region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:54,  majority:28, lastFought:2022, watchFor:'Lab vs Green. Green competitive in Kentish Town and Hampstead.',                     verdict:'Lab safe',             difficulty:'safe'},
    {name:'City of London',     region:'London',        type:'London Borough', control:'Ind',  noc:false, seats:100, majority:40, lastFought:2022, watchFor:'Unique ward elections. Ind and business candidate dominated. Unusual electorate.',    verdict:'Ind hold',             difficulty:'safe'},
    {name:'Croydon',            region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:70,  majority:20, lastFought:2022, watchFor:'Lab defending. Con competitive in Coulsdon and Selsdon. Reform advancing.',          verdict:'Lab defend',           difficulty:'hard'},
    {name:'Ealing',             region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:69,  majority:36, lastFought:2022, watchFor:'Lab fortress. Diverse borough. Green competitive in Hanwell.',                        verdict:'Lab safe',             difficulty:'safe'},
    {name:'Enfield',            region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:63,  majority:20, lastFought:2022, watchFor:'Lab defending. Con competitive in outer wards. Reform also present.',                 verdict:'Lab defend',           difficulty:'medium'},
    {name:'Greenwich',          region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:51,  majority:30, lastFought:2022, watchFor:'Lab stronghold. Reform limited by diverse outer London demographics.',                verdict:'Lab safe',             difficulty:'safe'},
    {name:'Hackney',            region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:57,  majority:36, lastFought:2022, watchFor:'Lab vs Green. Green very competitive in Stoke Newington and Haggerston.',             verdict:'Lab likely hold',      difficulty:'medium'},
    {name:'Hammersmith & Fulham',region:'London',       type:'London Borough', control:'Lab',  noc:false, seats:46,  majority:16, lastFought:2022, watchFor:'Lab defending 2022 gain. Con competitive in Fulham.',                               verdict:'Lab defend',           difficulty:'hard'},
    {name:'Haringey',           region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:57,  majority:28, lastFought:2022, watchFor:'Lab vs Green. Green competitive in Hornsey and Alexandra Park.',                     verdict:'Lab likely hold',      difficulty:'medium'},
    {name:'Harrow',             region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:63,  majority:22, lastFought:2022, watchFor:'Lab defending. Con competitive in suburban outer wards.',                             verdict:'Lab defend',           difficulty:'medium'},
    {name:'Havering',           region:'London',        type:'London Borough', control:'Con',  noc:false, seats:54,  majority:8,  lastFought:2022, watchFor:'Reform prime target. Romford — suburban Essex character. High Leave vote.',          verdict:'Reform prime target',  difficulty:'very hard'},
    {name:'Hillingdon',         region:'London',        type:'London Borough', control:'Con',  noc:false, seats:65,  majority:16, lastFought:2022, watchFor:'Con defending. Lab competitive in Hayes. Reform targeting Ruislip.',                  verdict:'Con defend',           difficulty:'medium'},
    {name:'Hounslow',           region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:60,  majority:28, lastFought:2022, watchFor:'Lab stronghold. Diverse borough — Heathrow hub. Reform limited ceiling.',             verdict:'Lab safe',             difficulty:'safe'},
    {name:'Islington',          region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:48,  majority:28, lastFought:2022, watchFor:'Lab vs Green. Very progressive inner-London borough. Jeremy Corbyn stomping ground.',  verdict:'Lab safe',             difficulty:'safe'},
    {name:'Kensington & Chelsea',region:'London',       type:'London Borough', control:'Con',  noc:false, seats:50,  majority:18, lastFought:2022, watchFor:'Con stronghold. Lab competitive in North Kensington. Affluent borough.',              verdict:'Con likely hold',      difficulty:'medium'},
    {name:'Kingston upon Thames',region:'London',       type:'London Borough', control:'LD',   noc:false, seats:48,  majority:18, lastFought:2022, watchFor:'LD stronghold. Con squeezed. Reform ceiling very low in affluent SW London.',         verdict:'LD safe',              difficulty:'safe'},
    {name:'Lambeth',            region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:63,  majority:38, lastFought:2022, watchFor:'Lab vs Green. Green very competitive in Herne Hill and Tulse Hill.',                  verdict:'Lab likely hold',      difficulty:'medium'},
    {name:'Lewisham',           region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:54,  majority:32, lastFought:2022, watchFor:'Lab vs Green. Green strong in New Cross and Forest Hill.',                            verdict:'Lab likely hold',      difficulty:'medium'},
    {name:'Merton',             region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:60,  majority:18, lastFought:2022, watchFor:'Lab defending. LD and Con competitive in Wimbledon and Raynes Park.',                verdict:'Lab defend',           difficulty:'medium'},
    {name:'Newham',             region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:60,  majority:44, lastFought:2022, watchFor:'Lab fortress. Most deprived London borough. Reform/Ind challenge from Muslim vote.',    verdict:'Lab likely hold',      difficulty:'medium'},
    {name:'Redbridge',          region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:63,  majority:22, lastFought:2022, watchFor:'Lab defending. Diverse borough — large Jewish and Asian communities.',                 verdict:'Lab defend',           difficulty:'medium'},
    {name:'Richmond upon Thames',region:'London',       type:'London Borough', control:'LD',   noc:false, seats:54,  majority:30, lastFought:2022, watchFor:'LD stronghold. Green competitive. Con squeezed. Very affluent.',                      verdict:'LD safe',              difficulty:'safe'},
    {name:'Southwark',          region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:63,  majority:34, lastFought:2022, watchFor:'Lab vs LD. Bermondsey historically LD — still competitive in N Bermondsey.',         verdict:'Lab likely hold',      difficulty:'medium'},
    {name:'Sutton',             region:'London',        type:'London Borough', control:'LD',   noc:false, seats:54,  majority:22, lastFought:2022, watchFor:'LD stronghold. Con distant second. Reform ceiling very low.',                         verdict:'LD safe',              difficulty:'safe'},
    {name:'Tower Hamlets',      region:'London',        type:'London Borough', control:'Aspire',noc:false,seats:45,  majority:14, lastFought:2022, watchFor:'Aspire (Lutfur Rahman) defending. Lab challenging. Unique political landscape.',       verdict:'Aspire defend',        difficulty:'hard'},
    {name:'Waltham Forest',     region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:60,  majority:30, lastFought:2022, watchFor:'Lab stronghold. Green competitive in Walthamstow. Reform very limited.',               verdict:'Lab safe',             difficulty:'safe'},
    {name:'Wandsworth',         region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:60,  majority:8,  lastFought:2022, watchFor:'Lab defending 2022 landmark gain from Con. Con looking to recapture.',                 verdict:'Lab vs Con toss-up',   difficulty:'very hard'},
    {name:'Westminster',        region:'London',        type:'London Borough', control:'Lab',  noc:false, seats:54,  majority:6,  lastFought:2022, watchFor:'Lab defending 2022 gain. Con will fight hard to recapture showpiece borough.',        verdict:'Lab vs Con toss-up',   difficulty:'very hard'},

  ]
};

export const LOCAL_REGIONS = [
  {
    name: 'North West',
    emoji: '🏭',
    councils: 15, seats: 720,
    difficulty: 'hard',
    accentColor: '#E4003B',
    story: 'Red Wall territory under siege from Reform UK. Lab defending a swathe of ex-mill and mining towns. Bolton, Oldham and Rochdale are key tests. Blackpool is Reform\'s most symbolic northern coastal target.',
    watchFor: 'Reform breakthrough in Blackpool, Oldham and Rochdale. Lab\'s ground game in ex-industrial towns.',
    councils_list: [
      {name:'Bolton'},{name:'Bury'},{name:'Manchester City'},{name:'Oldham'},{name:'Rochdale'},
      {name:'Salford'},{name:'Stockport'},{name:'Tameside'},{name:'Trafford'},{name:'Wigan'},
      {name:'Knowsley'},{name:'Liverpool'},{name:'Sefton'},{name:'St Helens'},{name:'Wirral'},
      {name:'Blackpool'},{name:'Warrington'},{name:'Cheshire East'},{name:'Halton'},
    ]
  },
  {
    name: 'Yorkshire',
    emoji: '🌹',
    councils: 9, seats: 560,
    difficulty: 'hard',
    accentColor: '#E4003B',
    story: 'Traditional Labour country facing Reform pressure in ex-mining and steel communities. Bradford is a complex battleground with Green, Reform and Lab all competing. Doncaster is the symbolic must-hold.',
    watchFor: 'Reform in Barnsley, Doncaster and Rotherham. Green surge in Bradford and Sheffield.',
    councils_list: [
      {name:'Bradford'},{name:'Calderdale'},{name:'Kirklees'},{name:'Leeds'},{name:'Wakefield'},
      {name:'Barnsley'},{name:'Doncaster'},{name:'Rotherham'},{name:'Sheffield'},
      {name:'York'},{name:'Kingston upon Hull'},{name:'East Riding of Yorks'},
    ]
  },
  {
    name: 'North East',
    emoji: '⚓',
    councils: 9, seats: 540,
    difficulty: 'very hard',
    accentColor: '#12B7D4',
    story: 'Reform UK\'s prime target region. Hartlepool, Darlington and Redcar are iconic seats for both Reform and Lab. Durham and Northumberland are county-wide unitary tests. The North East could deliver Reform its most significant council gains.',
    watchFor: 'Reform taking Hartlepool council. Northumberland three-way marginal. Darlington bellwether.',
    councils_list: [
      {name:'Durham'},{name:'Northumberland'},{name:'Gateshead'},{name:'Newcastle'},
      {name:'North Tyneside'},{name:'South Tyneside'},{name:'Sunderland'},
      {name:'Hartlepool'},{name:'Darlington'},{name:'Middlesbrough'},
      {name:'Redcar & Cleveland'},{name:'Stockton-on-Tees'},
    ]
  },
  {
    name: 'Midlands',
    emoji: '🏗️',
    councils: 12, seats: 700,
    difficulty: 'hard',
    accentColor: '#F97316',
    story: 'A mix of Labour metro boroughs and Reform-targeted working-class unitaries. Stoke-on-Trent is the most symbolic target nationally — it voted most strongly Leave in 2016. Dudley and Walsall are close three-way contests.',
    watchFor: 'Reform taking Stoke-on-Trent. Dudley three-way. Lab holding Walsall.',
    councils_list: [
      {name:'Birmingham'},{name:'Coventry'},{name:'Dudley'},{name:'Sandwell'},{name:'Solihull'},
      {name:'Walsall'},{name:'Wolverhampton'},{name:'Stoke-on-Trent'},{name:'Telford & Wrekin'},
      {name:'Shropshire'},{name:'Herefordshire'},{name:'Warwickshire'},
    ]
  },
  {
    name: 'East Midlands',
    emoji: '🏛️',
    councils: 10, seats: 480,
    difficulty: 'hard',
    accentColor: '#F97316',
    story: 'County councils and districts under Reform pressure. Nottinghamshire is the most marginal county council nationally — a two-seat Con majority. Boston district could become the first Reform-controlled council in the East Midlands.',
    watchFor: 'Nottinghamshire county flip. Boston district to Reform. Mansfield Ind vs Reform.',
    councils_list: [
      {name:'Leicestershire'},{name:'Lincolnshire'},{name:'Nottinghamshire'},
      {name:'Derby City'},{name:'Nottingham City'},{name:'Leicester City'},
      {name:'Rutland'},{name:'Peterborough'},{name:'Boston'},{name:'Mansfield'},
    ]
  },
  {
    name: 'East of England',
    emoji: '🌾',
    councils: 14, seats: 680,
    difficulty: 'hard',
    accentColor: '#12B7D4',
    story: 'Essex is Reform\'s most prized target county. Tendring (Clacton) and Thurrock are the headline battles. Fenland and Castle Point districts are also prime Reform territory. LD battles Con across Cambridgeshire and Hertfordshire.',
    watchFor: 'Reform in Tendring, Thurrock, Castle Point and Basildon. LD gains in St Albans and Cambridge.',
    councils_list: [
      {name:'Essex'},{name:'Hertfordshire'},{name:'Suffolk'},{name:'Norfolk'},{name:'Cambridgeshire'},
      {name:'Tendring'},{name:'Thurrock'},{name:'Southend-on-Sea'},{name:'Luton'},
      {name:'Bedford'},{name:'Central Bedfordshire'},{name:'Fenland'},{name:'Peterborough'},
    ]
  },
  {
    name: 'South East',
    emoji: '🌊',
    councils: 16, seats: 820,
    difficulty: 'hard',
    accentColor: '#0087DC',
    story: 'A tale of two trends: Reform surging in coastal Kent (Thanet, Dover, Swale) while LD makes Blue Wall gains in Surrey, Hampshire and Oxfordshire. Kent is the single most contested county in England. Hampshire\'s district councils see LD vs Con battles throughout.',
    watchFor: 'Reform takes Dover or Thanet district. LD majority in Oxfordshire county. Medway Reform vs Con.',
    councils_list: [
      {name:'Kent'},{name:'Surrey'},{name:'Hampshire'},{name:'Oxfordshire'},{name:'West Sussex'},{name:'East Sussex'},
      {name:'Thanet'},{name:'Dover'},{name:'Medway'},{name:'Folkestone & Hythe'},
      {name:'Winchester'},{name:'Eastleigh'},{name:'Wokingham'},{name:'Milton Keynes'},
    ]
  },
  {
    name: 'South West',
    emoji: '🌊',
    councils: 10, seats: 560,
    difficulty: 'medium',
    accentColor: '#FAA61A',
    story: 'Liberal Democrat country. Somerset, Bath and Cornwall are LD-dominated. Plymouth is a Labour-Reform marginal. Bristol is a Lab-Green battleground. Torbay is Reform\'s most significant South West coastal target.',
    watchFor: 'Reform takes Torbay. Lab defends Plymouth. LD holds Cornwall and Somerset.',
    councils_list: [
      {name:'Cornwall'},{name:'Somerset'},{name:'Wiltshire'},{name:'Bath & NE Somerset'},
      {name:'Bristol City'},{name:'Plymouth'},{name:'Torbay'},{name:'Swindon'},
      {name:'South Gloucestershire'},{name:'North Somerset'},
    ]
  },
  {
    name: 'London',
    emoji: '🏙️',
    councils: 33, seats: 1900,
    difficulty: 'medium',
    accentColor: '#E4003B',
    story: 'All 32 London boroughs plus City of London vote for all seats. Lab is dominant but Wandsworth and Westminster — lost to Lab in 2022 landmark — are the marquee Con comeback targets. Havering and Barking & Dagenham are Reform\'s London prizes. Tower Hamlets\'s Aspire vs Lab is the most unusual contest.',
    watchFor: 'Con recaptures Wandsworth and Westminster. Reform takes Havering. Aspire holds Tower Hamlets.',
    councils_list: [
      {name:'Barking & Dagenham'},{name:'Barnet'},{name:'Bexley'},{name:'Brent'},{name:'Bromley'},
      {name:'Camden'},{name:'Croydon'},{name:'Ealing'},{name:'Enfield'},{name:'Greenwich'},
      {name:'Hackney'},{name:'Hammersmith & Fulham'},{name:'Haringey'},{name:'Harrow'},{name:'Havering'},
      {name:'Hillingdon'},{name:'Hounslow'},{name:'Islington'},{name:'Kensington & Chelsea'},
      {name:'Kingston upon Thames'},{name:'Lambeth'},{name:'Lewisham'},{name:'Merton'},{name:'Newham'},
      {name:'Redbridge'},{name:'Richmond upon Thames'},{name:'Southwark'},{name:'Sutton'},
      {name:'Tower Hamlets'},{name:'Waltham Forest'},{name:'Wandsworth'},{name:'Westminster'},
      {name:'City of London'},
    ]
  },
  {
    name: 'Scotland',
    emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    councils: 1, seats: 129,
    difficulty: 'hard',
    accentColor: '#C4922A',
    story: 'Scottish Parliament elections under proportional representation. SNP defending after Yousaf resignation. Labour targeting a return to Scottish government. Reform making first serious attempt at Scottish seats via regional list.',
    watchFor: 'Lab gains at SNP expense. Reform list seats in Lothian and West Scotland. SNP majority gone.',
    councils_list: []
  },
  {
    name: 'Wales',
    emoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    councils: 1, seats: 96,
    difficulty: 'very hard',
    accentColor: '#3F8428',
    story: 'Expanded 96-seat Senedd uses a new proportional system for the first time. Reform UK surging in valleys communities. Labour dominance under serious threat. Plaid Cymru defending heartland seats.',
    watchFor: 'Reform list seats in South Wales valleys. Lab losing overall majority. Plaid holding Ynys Môn.',
    councils_list: []
  },
];

export const COUNCIL_PROFILES = {
  'Cambridgeshire': {
    control:'Con', leader:'Cllr Lucy Nethsingha (Con)',
    seats:{total:61, con:31, ld:15, lab:8, grn:5, ind:2},
    seatsUp:61, type:'County Council — all seats up',
    website:'https://www.cambridgeshire.gov.uk',
    prediction:'Reform surge expected in Fenland and South Cambridgeshire rural wards. LD targeting Cambridge city fringe seats. Con defending from 2021 peak but sentiment has shifted in a Leave-heavy county.',
    keyIssue:'Reform advance in Fenland. LD targeting urban fringes. Con majority slim.',
    lastElection:'2021 — Con 31, LD 15, Lab 8'
  },
  'Devon': {
    control:'Con', leader:'Cllr John Hart (Con)',
    seats:{total:60, con:30, ld:16, lab:7, grn:4, ind:3},
    seatsUp:60, type:'County Council — all seats up',
    website:'https://www.devon.gov.uk',
    prediction:'LD making serious inroads in Exeter-adjacent wards and coastal towns. Con defending from 2021 Johnson-era peak. Reform limited in Devon — LD is the main threat to Con.',
    keyIssue:'LD Blue Wall advance around Exeter and Barnstaple. Con defending slim majority.',
    lastElection:'2021 — Con 30, LD 16, Lab 7'
  },
  'Essex': {
    control:'Con', leader:'Cllr Kevin Bentley (Con)',
    seats:{total:75, con:45, lab:14, ukip:4, grn:3, ind:3, ld:2, ref:4},
    seatsUp:75, type:'County Council — all seats up',
    website:'https://www.essex.gov.uk',
    prediction:'Reform UK\'s premier county council target. High Leave vote throughout Essex. Tendring, Basildon and Castle Point districts already under Reform pressure. A Con collapse here would be the defining county story of the night.',
    keyIssue:'Reform surge in Basildon, Tendring and Harlow. Can Con hold their Essex heartland?',
    lastElection:'2021 — Con 45, Lab 14, UKIP 4'
  },
  'Kent': {
    control:'Con', leader:'Cllr Roger Gough (Con)',
    seats:{total:81, con:50, lab:13, ld:8, grn:4, ref:6},
    seatsUp:81, type:'County Council — all seats up',
    website:'https://www.kent.gov.uk',
    prediction:'Reform UK\'s most symbolic county council target. Thanet, Dover, Swale and Folkestone districts are coastal Leave heartlands. Kent has 13 districts all voting simultaneously — the perfect Reform ground. If Con lose Kent county, it marks a seismic shift.',
    keyIssue:'Reform surge in Thanet, Dover and Swale. LD advance in Tunbridge Wells and Sevenoaks.',
    lastElection:'2021 — Con 50, Lab 13, LD 8'
  },
  'Lancashire': {
    control:'Lab', leader:'Cllr Phillippa Williamson (Lab)',
    seats:{total:84, lab:44, con:24, ld:6, grn:4, ind:6},
    seatsUp:84, type:'County Council — all seats up',
    website:'https://www.lancashire.gov.uk',
    prediction:'Lab defending a knife-edge majority in a county that swung heavily to Leave. Reform targeting ex-Red Wall seats in Burnley, Pendle and Hyndburn. A Reform advance that costs Lab their majority would be a major story.',
    keyIssue:'Lab majority of 4 seats. Reform surge in Burnley, Accrington and Pendle.',
    lastElection:'2021 — Lab 44, Con 24, LD 6'
  },
  'Lincolnshire': {
    control:'Con', leader:'Cllr Martin Hill (Con)',
    seats:{total:70, con:47, lab:12, ld:4, grn:3, ind:4},
    seatsUp:70, type:'County Council — all seats up',
    website:'https://www.lincolnshire.gov.uk',
    prediction:'Reform UK advance expected throughout the county. Boston district — which had the highest Leave vote in the UK in 2016 — is the headline battle. Con majority is large but double-digit Reform gains are likely.',
    keyIssue:'Reform advance in Boston and Skegness coastal areas. Boston district could flip.',
    lastElection:'2021 — Con 47, Lab 12, LD 4'
  },
  'Nottinghamshire': {
    control:'Con', leader:'Cllr Ben Bradley (Con)',
    seats:{total:66, con:34, lab:22, grn:5, ld:3, ind:2},
    seatsUp:66, type:'County Council — all seats up',
    website:'https://www.nottinghamshire.gov.uk',
    prediction:'The most marginal county council in England — Con majority of just 2 seats. Lab, Reform and Green all competitive. Ashfield, Mansfield and Newark are the battleground districts. An extraordinary contest likely.',
    keyIssue:'Wafer-thin Con majority. Lab and Reform both targeting multiple Con seats.',
    lastElection:'2021 — Con 34, Lab 22, Grn 5'
  },
  'Surrey': {
    control:'Con', leader:'Cllr Tim Oliver (Con)',
    seats:{total:80, con:53, ld:14, lab:4, grn:4, ind:5},
    seatsUp:80, type:'County Council — all seats up',
    website:'https://www.surreycc.gov.uk',
    prediction:'Classic Blue Wall territory. LD advancing in Guildford, Waverley and Mole Valley. Con defending from 2021 peak. Reform unlikely to breakthrough in wealthy Surrey but could take a handful of outer seats.',
    keyIssue:'LD Blue Wall advance — Guildford a major LD target. Con defending 53 seats from Johnson-era peak.',
    lastElection:'2021 — Con 53, LD 14, Grn 4'
  },
  'West Sussex': {
    control:'Con', leader:'Cllr Paul Marshall (Con)',
    seats:{total:71, con:49, ld:12, lab:5, grn:3, ind:2},
    seatsUp:71, type:'County Council — all seats up',
    website:'https://www.westsussex.gov.uk',
    prediction:'Con likely hold but LD making inroads in Chichester and Worthing. Reform unlikely to breakthrough. A reduced Con majority is the most probable outcome.',
    keyIssue:'LD competitive in Chichester and Horsham — both LD parliamentary seats since 2024.',
    lastElection:'2021 — Con 49, LD 12'
  },
  'Worcestershire': {
    control:'Con', leader:'Cllr Simon Geraghty (Con)',
    seats:{total:57, con:38, lab:10, ld:4, grn:2, ind:3},
    seatsUp:57, type:'County Council — all seats up',
    website:'https://www.worcestershire.gov.uk',
    prediction:'Reform UK advance expected in Redditch, Bromsgrove and Wyre Forest — strong Leave areas. Con defending comfortably in seat numbers but double-digit losses are plausible.',
    keyIssue:'Redditch and Wyre Forest are classic Reform target areas. Wyre Forest had an independent MP — strong protest vote history.',
    lastElection:'2021 — Con 38, Lab 10'
  },
  'Havering': {
    control:'Con', leader:'Cllr Ray Morgon (Con)',
    seats:{total:54, con:32, ukip:6, lab:8, ref:8},
    seatsUp:54, type:'London Borough — all seats up',
    website:'https://www.havering.gov.uk',
    prediction:'Reform UK\'s most realistic London borough target. Romford and Hornchurch have suburban Essex characteristics — high Leave vote, working-class, anti-establishment sentiment strong. Con defending but Reform polling at council-flipping levels.',
    keyIssue:'Reform take control of Havering — would be a landmark London result. Con vs Reform head to head.',
    lastElection:'2022 — Con 32, UKIP/Res 6, Lab 8'
  },
  'Barking & Dagenham': {
    control:'Lab', leader:'Cllr Darren Rodwell (Lab)',
    seats:{total:51, lab:36, con:6, res:9},
    seatsUp:51, type:'London Borough — all seats up',
    website:'https://www.lbbd.gov.uk',
    prediction:'Reform UK prime London target. The borough has a history of BNP and UKIP support in outer wards. Lab defending a large majority but Reform polling strongly. A Reform breakthrough here would be nationally significant.',
    keyIssue:'Reform advance in Dagenham Heathway and Becontree. Lab defending a historic seat.',
    lastElection:'2022 — Lab 36, Residents 9'
  },
  'Wandsworth': {
    control:'Lab', leader:'Cllr Simon Hogg (Lab)',
    seats:{total:60, lab:34, con:26},
    seatsUp:60, type:'London Borough — all seats up',
    website:'https://www.wandsworth.gov.uk',
    prediction:'The marquee London contest. Lab\'s 2022 gain from Con was a historic upset — Con had held Wandsworth for decades. Con will fight extremely hard to recapture it. Battersea and Tooting are the key wards.',
    keyIssue:'Con vs Lab — the rematch of 2022\'s most shocking result. Con need uniform swing of 3.5% to retake.',
    lastElection:'2022 — Lab 34, Con 26'
  },
  'Westminster': {
    control:'Lab', leader:'Cllr Adam Hug (Lab)',
    seats:{total:54, lab:31, con:23},
    seatsUp:54, type:'London Borough — all seats up',
    website:'https://www.westminster.gov.uk',
    prediction:'Con flagship recapture target. Lab\'s 2022 gain was as symbolic as Wandsworth. Westminster\'s demographics are complex — central London wards skew Lab, outer wards Con. Could go either way.',
    keyIssue:'Lab defending 2022 landmark gain. Con\'s most prestigious recovery target in London.',
    lastElection:'2022 — Lab 31, Con 23'
  },
  'Tower Hamlets': {
    control:'Aspire', leader:'Mayor Lutfur Rahman (Aspire)',
    seats:{total:45, aspire:24, lab:19, grn:2},
    seatsUp:45, type:'London Borough — all seats up + Mayoral',
    website:'https://www.towerhamlets.gov.uk',
    prediction:'Unique political contest. Lutfur Rahman\'s Aspire party defending control after 2022 landslide. Lab fighting to recapture. Mayor elected separately. National attention on Bethnal Green and Poplar wards.',
    keyIssue:'Aspire vs Lab. Rahman re-election as Mayor. National scrutiny on governance and community politics.',
    lastElection:'2022 — Aspire 24, Lab 19, Grn 2'
  },
  'Stoke-on-Trent': {
    control:'Lab', leader:'Cllr Jane Ashworth (Lab)',
    seats:{total:44, lab:22, con:14, ind:6, ref:2},
    seatsUp:44, type:'Unitary Authority — all seats up',
    website:'https://www.stoke.gov.uk',
    prediction:'The most symbolically important Reform UK target outside London. Stoke-on-Trent voted most strongly Leave in 2016 (69%). Already has Reform councillors. A Reform majority here would be the defining result of the night nationally.',
    keyIssue:'Reform prime target nationally. Already has Reform councillors. Will be watched worldwide.',
    lastElection:'2021 — Lab 22, Con 14, Ind 6'
  },
  'Hartlepool': {
    control:'Con', leader:'Cllr Shane Moore (Con)',
    seats:{total:33, con:17, lab:10, ind:6},
    seatsUp:33, type:'Unitary Authority — all seats up',
    website:'https://www.hartlepool.gov.uk',
    prediction:'Reform UK primary target. The 2021 parliamentary by-election that delivered Con a stunning gain — Con now defends a council majority in a town that has culturally shifted right. Reform could take the council outright.',
    keyIssue:'Reform challenge for outright control. Con defending in Reform\'s ideal territory.',
    lastElection:'2021 — Con 17, Lab 10, Ind 6'
  },
  'Boston': {
    control:'Con', leader:'Cllr Anne Dorrian (Con)',
    seats:{total:33, con:19, ukip:6, lab:4, ind:4},
    seatsUp:33, type:'District Council',
    website:'https://www.boston.gov.uk',
    prediction:'Reform UK prime target. Boston had the highest Leave vote of any local authority in 2016 (75.6%). UKIP had significant presence. Reform stands to make major gains or even take control.',
    keyIssue:'Highest Leave vote in England. UKIP to Reform pipeline. Con defending.',
    lastElection:'2019 — Con 19, UKIP 6, Lab 4'
  },
  'Thanet': {
    control:'NOC', leader:'No overall control',
    seats:{total:56, con:20, lab:14, grn:8, ref:6, ind:8},
    seatsUp:56, type:'District Council',
    website:'https://www.thanet.gov.uk',
    prediction:'The most historically significant Reform UK target in Kent. Margate and Ramsgate — coastal deprivation, UKIP heartland. Nigel Farage stood for Parliament here twice. Reform could take majority control.',
    keyIssue:'Reform surge in Margate and Ramsgate. UKIP history. Currently no overall control.',
    lastElection:'2023 — NOC, Con 20, Lab 14, Grn 8'
  },
};

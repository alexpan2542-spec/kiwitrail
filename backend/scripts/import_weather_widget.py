from sqlalchemy import create_engine, text

PARK_RAW_DATA = """
77, Angelus Hut, https://widgets.niwa.co.nz/summaries/park/47/3/white
77, Aoraki/Mt Cook VC, https://widgets.niwa.co.nz/summaries/park/5/3/white
77, Arete Hut, https://widgets.niwa.co.nz/summaries/park/4/3/white
77, Arthurs Pass, https://widgets.niwa.co.nz/summaries/park/52/3/white
77, Avalanche Peak, https://widgets.niwa.co.nz/summaries/park/29/3/white
77, Bark Bay Hut, https://widgets.niwa.co.nz/summaries/park/37/3/white
77, Ben Lomond Summit, https://widgets.niwa.co.nz/summaries/park/61/3/white
77, Brewster Hut, https://widgets.niwa.co.nz/summaries/park/26/3/white
77, Cape Reinga, https://widgets.niwa.co.nz/summaries/park/51/3/white
77, Carrington Hut, https://widgets.niwa.co.nz/summaries/park/7/3/white
77, Carroll Hut, https://widgets.niwa.co.nz/summaries/park/8/3/white
77, Cascade Saddle, https://widgets.niwa.co.nz/summaries/park/3/3/white
77, Cathedral Cove, https://widgets.niwa.co.nz/summaries/park/81/3/white
77, Christopher Hut, https://widgets.niwa.co.nz/summaries/park/59/3/white
77, Corner Creek, https://widgets.niwa.co.nz/summaries/park/78/3/white
77, Devilskin Saddle, https://widgets.niwa.co.nz/summaries/park/65/3/white
77, Double Cone, https://widgets.niwa.co.nz/summaries/park/67/3/white
77, Franz Josef Glacier, https://widgets.niwa.co.nz/summaries/park/49/3/white
77, Ghost Lake Hut, https://widgets.niwa.co.nz/summaries/park/70/3/white
77, Giant Café, https://widgets.niwa.co.nz/summaries/park/74/3/white
77, Harris Saddle, https://widgets.niwa.co.nz/summaries/park/30/3/white
77, Huxley Forks Hut, https://widgets.niwa.co.nz/summaries/park/71/3/white
77, Ida Railway Hut, https://widgets.niwa.co.nz/summaries/park/60/3/white
77, John Coull Hut, https://widgets.niwa.co.nz/summaries/park/14/3/white
77, Karangahake Gorge, https://widgets.niwa.co.nz/summaries/park/76/3/white
77, Kaweka J Summit, https://widgets.niwa.co.nz/summaries/park/63/3/white
77, Kime Hut, https://widgets.niwa.co.nz/summaries/park/17/3/white
77, Knoll Ridge Café, https://widgets.niwa.co.nz/summaries/park/73/3/white
77, Luxmore Hut, https://widgets.niwa.co.nz/summaries/park/20/3/white
77, McKinnon Pass, https://widgets.niwa.co.nz/summaries/park/24/3/white
77, Milford Sound, https://widgets.niwa.co.nz/summaries/park/1/3/white
77, Moonlight Tops Hut, https://widgets.niwa.co.nz/summaries/park/2/3/white
77, Mount Owen, https://widgets.niwa.co.nz/summaries/park/6/3/white
77, Mt Arrowsmith, https://widgets.niwa.co.nz/summaries/park/54/3/white
77, Mt Arthur, https://widgets.niwa.co.nz/summaries/park/21/3/white
77, Mt Aspiring/Tititea, https://widgets.niwa.co.nz/summaries/park/19/3/white
77, Mt Cheeseman, https://widgets.niwa.co.nz/summaries/park/69/3/white
77, Mt Heale Hut, https://widgets.niwa.co.nz/summaries/park/57/3/white
77, Mt Oxford, https://widgets.niwa.co.nz/summaries/park/53/3/white
77, Mt Pirongia, https://widgets.niwa.co.nz/summaries/park/66/3/white
77, Mt Pureora, https://widgets.niwa.co.nz/summaries/park/43/3/white
77, Mt Richmond, https://widgets.niwa.co.nz/summaries/park/11/3/white
77, Mt Tapuae-o-Uenuku, https://widgets.niwa.co.nz/summaries/park/64/3/white
77, Mueller Hut, https://widgets.niwa.co.nz/summaries/park/44/3/white
77, North Taranaki VC, https://widgets.niwa.co.nz/summaries/park/41/3/white
77, Okaka Lodge, https://widgets.niwa.co.nz/summaries/park/42/3/white
77, Panekire Hut, https://widgets.niwa.co.nz/summaries/park/13/3/white
77, Perry Saddle, https://widgets.niwa.co.nz/summaries/park/46/3/white
77, Pinnacles Hut, https://widgets.niwa.co.nz/summaries/park/23/3/white
77, Pioneer Hut, https://widgets.niwa.co.nz/summaries/park/72/3/white
77, Port William Hut, https://widgets.niwa.co.nz/summaries/park/31/3/white
77, Pouakai Hut, https://widgets.niwa.co.nz/summaries/park/10/3/white
77, Poukirikiri/Travers, https://widgets.niwa.co.nz/summaries/park/35/3/white
77, Powell Hut, https://widgets.niwa.co.nz/summaries/park/16/3/white
77, Punakaiki VC, https://widgets.niwa.co.nz/summaries/park/48/3/white
77, Rangiwahia Hut, https://widgets.niwa.co.nz/summaries/park/56/3/white
77, Rotoiti/Nelson Lk VC, https://widgets.niwa.co.nz/summaries/park/32/3/white
77, Roys Peak, https://widgets.niwa.co.nz/summaries/park/58/3/white
77, Siberia Hut, https://widgets.niwa.co.nz/summaries/park/36/3/white
77, Smoke-ho, https://widgets.niwa.co.nz/summaries/park/18/3/white
77, Stag Saddle, https://widgets.niwa.co.nz/summaries/park/27/3/white
77, Summit Taranaki Maunga, https://widgets.niwa.co.nz/summaries/park/45/3/white
77, Sunrise Hut, https://widgets.niwa.co.nz/summaries/park/12/3/white
77, Tasman Saddle Hut, https://widgets.niwa.co.nz/summaries/park/9/3/white
77, Tongariro Alpine Crossing, https://widgets.niwa.co.nz/summaries/park/80/3/white
77, Tongariro VC, https://widgets.niwa.co.nz/summaries/park/40/3/white
77, Turere Lodge, https://widgets.niwa.co.nz/summaries/park/38/3/white
77, Upper Tama Lake, https://widgets.niwa.co.nz/summaries/park/15/3/white
77, Waiau Pass, https://widgets.niwa.co.nz/summaries/park/25/3/white
77, Waipakihi Hut, https://widgets.niwa.co.nz/summaries/park/22/3/white
77, Wairere Falls, https://widgets.niwa.co.nz/summaries/park/77/3/white
77, Waitawheta Hut, https://widgets.niwa.co.nz/summaries/park/62/3/white
77, Waitewaewae Hut, https://widgets.niwa.co.nz/summaries/park/34/3/white
77, Waitonga Falls, https://widgets.niwa.co.nz/summaries/park/28/3/white
77, Welcome Flat Hut, https://widgets.niwa.co.nz/summaries/park/68/3/white
77, Wilmot Pass, https://widgets.niwa.co.nz/summaries/park/39/3/white
77, Woolshed Creek Hut, https://widgets.niwa.co.nz/summaries/park/55/3/white
""".strip()

NATIONAL_RAW_DATA = """
177, Akaroa Ews, https://widgets.niwa.co.nz/summaries/nz/55858492/3/white
177, Ākitio, https://widgets.niwa.co.nz/summaries/nz/42910367/3/white
177, Albert Burn, https://widgets.niwa.co.nz/summaries/nz/42910368/3/white
177, Alexandra, https://widgets.niwa.co.nz/summaries/nz/42910370/3/white
177, Aoraki Mount Cook, https://widgets.niwa.co.nz/summaries/nz/42910583/3/white
177, Appleby, https://widgets.niwa.co.nz/summaries/nz/42910372/3/white
177, Arapito, https://widgets.niwa.co.nz/summaries/nz/42910373/3/white
177, Arrowsmith Range, https://widgets.niwa.co.nz/summaries/nz/55858516/3/white
177, Arthurs Pass, https://widgets.niwa.co.nz/summaries/nz/42910375/3/white
177, Auckland, https://widgets.niwa.co.nz/summaries/nz/229675319/3/white
177, Auckland (Airport), https://widgets.niwa.co.nz/summaries/nz/42910380/3/white
177, Auckland (Māngere), https://widgets.niwa.co.nz/summaries/nz/634959177/3/white
177, Auckland (Nth Shore), https://widgets.niwa.co.nz/summaries/nz/55858493/3/white
177, Awakino, https://widgets.niwa.co.nz/summaries/nz/42910383/3/white
177, Balclutha, https://widgets.niwa.co.nz/summaries/nz/42910385/3/white
177, Baring Head, https://widgets.niwa.co.nz/summaries/nz/113776245/3/white
177, Blenheim, https://widgets.niwa.co.nz/summaries/nz/42910399/3/white
177, Brothers Island, https://widgets.niwa.co.nz/summaries/nz/55858444/3/white
177, Cape Campbell, https://widgets.niwa.co.nz/summaries/nz/55858446/3/white
177, Cape Reinga, https://widgets.niwa.co.nz/summaries/nz/55858447/3/white
177, Castle Mount, https://widgets.niwa.co.nz/summaries/nz/1259275826/3/white
177, Castlepoint, https://widgets.niwa.co.nz/summaries/nz/55858448/3/white
177, Chatham Islands, https://widgets.niwa.co.nz/summaries/nz/55858449/3/white
177, Chertsey, https://widgets.niwa.co.nz/summaries/nz/55858494/3/white
177, Cheviot, https://widgets.niwa.co.nz/summaries/nz/42910428/3/white
177, Christchurch, https://widgets.niwa.co.nz/summaries/nz/42910430/3/white
177, Christchurch (Airport), https://widgets.niwa.co.nz/summaries/nz/55858450/3/white
177, Clyde, https://widgets.niwa.co.nz/summaries/nz/44514131/3/white
177, Crail Bay, https://widgets.niwa.co.nz/summaries/nz/42910637/3/white
177, Cromwell, https://widgets.niwa.co.nz/summaries/nz/42910437/3/white
177, Dannevirke, https://widgets.niwa.co.nz/summaries/nz/42910442/3/white
177, Darfield, https://widgets.niwa.co.nz/summaries/nz/42910445/3/white
177, Dargaville, https://widgets.niwa.co.nz/summaries/nz/42910446/3/white
177, Diamond Harbour, https://widgets.niwa.co.nz/summaries/nz/229675251/3/white
177, Dunedin, https://widgets.niwa.co.nz/summaries/nz/42910454/3/white
177, Dunedin (Airport), https://widgets.niwa.co.nz/summaries/nz/55858451/3/white
177, Eglinton Flats, https://widgets.niwa.co.nz/summaries/nz/55858495/3/white
177, Farewell Spit, https://widgets.niwa.co.nz/summaries/nz/55858453/3/white
177, Franz Josef, https://widgets.niwa.co.nz/summaries/nz/42910466/3/white
177, Gisborne, https://widgets.niwa.co.nz/summaries/nz/42910471/3/white
177, Greymouth, https://widgets.niwa.co.nz/summaries/nz/42910483/3/white
177, Haast, https://widgets.niwa.co.nz/summaries/nz/55858455/3/white
177, Hakataramea Valley, https://widgets.niwa.co.nz/summaries/nz/55858496/3/white
177, Hamilton, https://widgets.niwa.co.nz/summaries/nz/42910667/3/white
177, Hamilton (Airport), https://widgets.niwa.co.nz/summaries/nz/55858456/3/white
177, Hanmer Forest, https://widgets.niwa.co.nz/summaries/nz/42910489/3/white
177, Hastings, https://widgets.niwa.co.nz/summaries/nz/42910777/3/white
177, Hāwera, https://widgets.niwa.co.nz/summaries/nz/55858457/3/white
177, Hicks Bay, https://widgets.niwa.co.nz/summaries/nz/55858458/3/white
177, Hokitika, https://widgets.niwa.co.nz/summaries/nz/229675279/3/white
177, Invercargill, https://widgets.niwa.co.nz/summaries/nz/42910510/3/white
177, Ivory Glacier, https://widgets.niwa.co.nz/summaries/nz/55858497/3/white
177, Kaikohe, https://widgets.niwa.co.nz/summaries/nz/55858461/3/white
177, Kaikōura, https://widgets.niwa.co.nz/summaries/nz/221149754/3/white
177, Kaikōura Peninsula, https://widgets.niwa.co.nz/summaries/nz/55858462/3/white
177, Kaitaia, https://widgets.niwa.co.nz/summaries/nz/42910519/3/white
177, Kaitaia (Airport), https://widgets.niwa.co.nz/summaries/nz/42910518/3/white
177, Karapiro, https://widgets.niwa.co.nz/summaries/nz/42910535/3/white
177, Kerikeri, https://widgets.niwa.co.nz/summaries/nz/42910532/3/white
177, Kumeū, https://widgets.niwa.co.nz/summaries/nz/44514134/3/white
177, Lake Brunner, https://widgets.niwa.co.nz/summaries/nz/55858510/3/white
177, Lake Manapouri, https://widgets.niwa.co.nz/summaries/nz/42910554/3/white
177, Lake Moeraki, https://widgets.niwa.co.nz/summaries/nz/42910536/3/white
177, Lake Orbell, https://widgets.niwa.co.nz/summaries/nz/55858513/3/white
177, Lake Tekapo, https://widgets.niwa.co.nz/summaries/nz/42910538/3/white
177, Lauder, https://widgets.niwa.co.nz/summaries/nz/42910539/3/white
177, Le Bons Bay, https://widgets.niwa.co.nz/summaries/nz/55858463/3/white
177, Leigh, https://widgets.niwa.co.nz/summaries/nz/42910543/3/white
177, Levin, https://widgets.niwa.co.nz/summaries/nz/467088945/3/white
177, Lincoln, https://widgets.niwa.co.nz/summaries/nz/42910546/3/white
177, Lismore, https://widgets.niwa.co.nz/summaries/nz/55858499/3/white
177, Lowther, https://widgets.niwa.co.nz/summaries/nz/229675246/3/white
177, Lumsden, https://widgets.niwa.co.nz/summaries/nz/55858465/3/white
177, Māhia Peninsula, https://widgets.niwa.co.nz/summaries/nz/55858466/3/white
177, Manaia, https://widgets.niwa.co.nz/summaries/nz/649156448/3/white
177, Martinborough, https://widgets.niwa.co.nz/summaries/nz/42910560/3/white
177, Masterton, https://widgets.niwa.co.nz/summaries/nz/229675272/3/white
177, Matamata, https://widgets.niwa.co.nz/summaries/nz/42910563/3/white
177, Maungatapere, https://widgets.niwa.co.nz/summaries/nz/44514133/3/white
177, Mayfield, https://widgets.niwa.co.nz/summaries/nz/589905174/3/white
177, Medbury, https://widgets.niwa.co.nz/summaries/nz/229675278/3/white
177, Methven, https://widgets.niwa.co.nz/summaries/nz/55858503/3/white
177, Middlemarch, https://widgets.niwa.co.nz/summaries/nz/42910567/3/white
177, Milford Sound, https://widgets.niwa.co.nz/summaries/nz/229675300/3/white
177, Mokohinau, https://widgets.niwa.co.nz/summaries/nz/55858467/3/white
177, Mōtū, https://widgets.niwa.co.nz/summaries/nz/42910578/3/white
177, Motueka, https://widgets.niwa.co.nz/summaries/nz/42910580/3/white
177, Mount Larkins, https://widgets.niwa.co.nz/summaries/nz/1259275824/3/white
177, Mount Philistine, https://widgets.niwa.co.nz/summaries/nz/55858505/3/white
177, Mount Potts, https://widgets.niwa.co.nz/summaries/nz/55858506/3/white
177, Mount Ruapehu - Chateau, https://widgets.niwa.co.nz/summaries/nz/42910585/3/white
177, Mueller Hut, https://widgets.niwa.co.nz/summaries/nz/55858507/3/white
177, Murchison Mtns, https://widgets.niwa.co.nz/summaries/nz/55858508/3/white
177, Napier, https://widgets.niwa.co.nz/summaries/nz/695808279/3/white
177, Napier (Airport), https://widgets.niwa.co.nz/summaries/nz/55858468/3/white
177, Nelson, https://widgets.niwa.co.nz/summaries/nz/55858469/3/white
177, Nelson Lakes, https://widgets.niwa.co.nz/summaries/nz/55858501/3/white
177, New Plymouth, https://widgets.niwa.co.nz/summaries/nz/55858470/3/white
177, Ngawi, https://widgets.niwa.co.nz/summaries/nz/55858471/3/white
177, Nugget Point, https://widgets.niwa.co.nz/summaries/nz/55858472/3/white
177, Ōamaru, https://widgets.niwa.co.nz/summaries/nz/229675259/3/white
177, Ohakune, https://widgets.niwa.co.nz/summaries/nz/42910613/3/white
177, Ohoka, https://widgets.niwa.co.nz/summaries/nz/666358550/3/white
177, Ōkārito, https://widgets.niwa.co.nz/summaries/nz/42910614/3/white
177, Ōmarama, https://widgets.niwa.co.nz/summaries/nz/55858482/3/white
177, Ōpōtiki, https://widgets.niwa.co.nz/summaries/nz/42910619/3/white
177, Orari Estate Ews, https://widgets.niwa.co.nz/summaries/nz/42910623/3/white
177, Otamatuna, Te Mapou Hut Cws, https://widgets.niwa.co.nz/summaries/nz/55858509/3/white
177, Paengaroa, https://widgets.niwa.co.nz/summaries/nz/42910627/3/white
177, Paeroa, https://widgets.niwa.co.nz/summaries/nz/55858473/3/white
177, Pahiatua, https://widgets.niwa.co.nz/summaries/nz/42910629/3/white
177, Palmerston North, https://widgets.niwa.co.nz/summaries/nz/42910633/3/white
177, Palmerston Nth (Airport), https://widgets.niwa.co.nz/summaries/nz/55858474/3/white
177, Papahaua, https://widgets.niwa.co.nz/summaries/nz/77786937/3/white
177, Paraparaumu, https://widgets.niwa.co.nz/summaries/nz/42910635/3/white
177, Pipiroa, https://widgets.niwa.co.nz/summaries/nz/46511096/3/white
177, Pukekohe, https://widgets.niwa.co.nz/summaries/nz/42910646/3/white
177, Pureora Forest, https://widgets.niwa.co.nz/summaries/nz/55858511/3/white
177, Purerua Peninsula, https://widgets.niwa.co.nz/summaries/nz/55858476/3/white
177, Puysegur Point, https://widgets.niwa.co.nz/summaries/nz/55858477/3/white
177, Queenstown, https://widgets.niwa.co.nz/summaries/nz/229675343/3/white
177, Queenstown (Airport), https://widgets.niwa.co.nz/summaries/nz/55858478/3/white
177, Ranfurly, https://widgets.niwa.co.nz/summaries/nz/42910653/3/white
177, Rangiora, https://widgets.niwa.co.nz/summaries/nz/42910654/3/white
177, Reefton, https://widgets.niwa.co.nz/summaries/nz/42910659/3/white
177, Retaruke, https://widgets.niwa.co.nz/summaries/nz/55858500/3/white
177, Richmond, https://widgets.niwa.co.nz/summaries/nz/221149758/3/white
177, Rotorua, https://widgets.niwa.co.nz/summaries/nz/229675261/3/white
177, Secretary Island, https://widgets.niwa.co.nz/summaries/nz/55858480/3/white
177, South West Cape, https://widgets.niwa.co.nz/summaries/nz/55858481/3/white
177, Stephens Is, https://widgets.niwa.co.nz/summaries/nz/42910676/3/white
177, Stratford, https://widgets.niwa.co.nz/summaries/nz/42910682/3/white
177, Tākaka, https://widgets.niwa.co.nz/summaries/nz/42910692/3/white
177, Tarapounamu, https://widgets.niwa.co.nz/summaries/nz/42910698/3/white
177, Taumarunui, https://widgets.niwa.co.nz/summaries/nz/229675262/3/white
177, Taupō, https://widgets.niwa.co.nz/summaries/nz/55858483/3/white
177, Tauranga, https://widgets.niwa.co.nz/summaries/nz/55858484/3/white
177, Te Anau, https://widgets.niwa.co.nz/summaries/nz/221149756/3/white
177, Te Kuiti, https://widgets.niwa.co.nz/summaries/nz/42910708/3/white
177, Te Pa, https://widgets.niwa.co.nz/summaries/nz/77786936/3/white
177, Te Puke, https://widgets.niwa.co.nz/summaries/nz/42910710/3/white
177, Te Puna, https://widgets.niwa.co.nz/summaries/nz/44514136/3/white
177, Te Teko, https://widgets.niwa.co.nz/summaries/nz/44514137/3/white
177, Timaru, https://widgets.niwa.co.nz/summaries/nz/42910716/3/white
177, Timaru (Airport), https://widgets.niwa.co.nz/summaries/nz/55858485/3/white
177, Tiwai Point, https://widgets.niwa.co.nz/summaries/nz/42910720/3/white
177, Trounson Kauri Park, https://widgets.niwa.co.nz/summaries/nz/55858514/3/white
177, Tūrangi, https://widgets.niwa.co.nz/summaries/nz/42910727/3/white
177, Tutira, https://widgets.niwa.co.nz/summaries/nz/55858515/3/white
177, Upper Hutt, https://widgets.niwa.co.nz/summaries/nz/150423400/3/white
177, Waiau, https://widgets.niwa.co.nz/summaries/nz/55858517/3/white
177, Waikeria, https://widgets.niwa.co.nz/summaries/nz/808070017/3/white
177, Waimate, https://widgets.niwa.co.nz/summaries/nz/55858518/3/white
177, Waiouru, https://widgets.niwa.co.nz/summaries/nz/229675280/3/white
177, Waipara, https://widgets.niwa.co.nz/summaries/nz/42910743/3/white
177, Waipara River, https://widgets.niwa.co.nz/summaries/nz/55858519/3/white
177, Waipawa, https://widgets.niwa.co.nz/summaries/nz/42910744/3/white
177, Wairau Valley, https://widgets.niwa.co.nz/summaries/nz/55858520/3/white
177, Wairoa, https://widgets.niwa.co.nz/summaries/nz/42910747/3/white
177, Waitutu River, https://widgets.niwa.co.nz/summaries/nz/55858521/3/white
177, Wānaka, https://widgets.niwa.co.nz/summaries/nz/229675277/3/white
177, Warkworth, https://widgets.niwa.co.nz/summaries/nz/42910761/3/white
177, Wellington, https://widgets.niwa.co.nz/summaries/nz/229675266/3/white
177, Wellington (Airport), https://widgets.niwa.co.nz/summaries/nz/55858487/3/white
177, West Eyreton, https://widgets.niwa.co.nz/summaries/nz/42910769/3/white
177, Westport, https://widgets.niwa.co.nz/summaries/nz/229675371/3/white
177, Westport (Airport), https://widgets.niwa.co.nz/summaries/nz/55858488/3/white
177, Whakamārama, https://widgets.niwa.co.nz/summaries/nz/42910525/3/white
177, Whakatāne, https://widgets.niwa.co.nz/summaries/nz/315198180/3/white
177, Whanganui, https://widgets.niwa.co.nz/summaries/nz/42910760/3/white
177, Whangaparāoa, https://widgets.niwa.co.nz/summaries/nz/55858489/3/white
177, Whangārei, https://widgets.niwa.co.nz/summaries/nz/221149757/3/white
177, Whatawhata, https://widgets.niwa.co.nz/summaries/nz/42910783/3/white
177, Whenuakite, https://widgets.niwa.co.nz/summaries/nz/44514135/3/white
177, Whitianga, https://widgets.niwa.co.nz/summaries/nz/221149755/3/white
177, Winchmore, https://widgets.niwa.co.nz/summaries/nz/431337275/3/white
177, Windsor, https://widgets.niwa.co.nz/summaries/nz/42910789/3/white
""".strip()


def parse_rows(raw_data: str, widget_type: str):
    rows = []

    for line_number, line in enumerate(raw_data.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue

        parts = [p.strip() for p in line.split(",", maxsplit=2)]
        if len(parts) != 3:
            raise ValueError(f"Invalid line {line_number}: {line}")

        category_id_str, name, url = parts

        rows.append(
            {
                "category_id": int(category_id_str),
                "name": name,
                "url": url.replace("/3/white", "/6/white"),
                "type": widget_type,
            }
        )

    return rows


def build_all_rows():
    park_rows = parse_rows(PARK_RAW_DATA, "park")
    national_rows = parse_rows(NATIONAL_RAW_DATA, "national")
    return park_rows + national_rows


def main():
    engine = create_engine("postgresql+psycopg2://alex@localhost:5432/postgres")
    rows = build_all_rows()

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS kiwi_weather_widget (
        id BIGSERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK (type IN ('park', 'national')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """

    upsert_sql = """
    INSERT INTO kiwi_weather_widget (category_id, name, url, type)
    VALUES (:category_id, :name, :url, :type)
    ON CONFLICT (url) DO UPDATE
    SET
        category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        type = EXCLUDED.type;
    """

    with engine.begin() as conn:
        conn.execute(text(create_table_sql))
        conn.execute(text(upsert_sql), rows)

    print(f"Inserted/updated {len(rows)} records successfully.")


if __name__ == "__main__":
    main()
# 從 tools/icon_list.txt（人工分類＋中文名稱＋中文關鍵字）挑出約 500 個圖示
# 依據：Google Fonts 圖示 metadata 的 popularity（https://fonts.google.com/metadata/icons）＋與半導體／製造／商業／IT 簡報的相關性
# 用法：python3 tools/select_icons.py <metadata 檔> <@material-symbols/svg-400/rounded 目錄>  → tools/icon_selected.json
import json,sys,os,collections
meta=json.loads(open(sys.argv[1],encoding='utf-8').read().lstrip(")]}'\n"))
pop={i['name']:i['popularity'] for i in meta['icons']}
tags={i['name']:i.get('tags',[]) for i in meta['icons']}
rank={n:k for k,n in enumerate(sorted(pop,key=lambda n:-pop[n]))}
R=set(f[:-4] for f in os.listdir(sys.argv[2]) if f.endswith('.svg'))
# 每類上限（依熱門度排序取前 N；保護清單不受上限影響）
QUOTA={'人員與組織':30,'製造與設備':99,'品質與檢測':30,'資料與 IT':42,'分析與圖表':32,'狀態與警示':34,'時間與排程':22,'文件與檔案':36,'任務與專案':30,
 '想法與策略':18,'工具與設定':20,'安全與權限':18,'流程與方向':30,'財務與商業':30,'溝通與會議':28,'物流與地點':24,'能源與環境':24,'操作與介面':30}
# 與工作簡報無關／偏消費生活的圖示（即使熱門也不收）
DROP=set('restaurant local_cafe cottage family_restroom elderly pedal_bike two_wheeler directions_run holiday_village location_home other_houses house local_hospital emergency fast_rewind skip_previous tv compost grass star_half'.split())
# 半導體／製造／品質相關：不受熱門度上限影響
KEEP=set('wafer factory precision_manufacturing conveyor_belt memory memory_alt developer_board frame_inspect biotech science experiment labs troubleshoot bug_report forklift valve propane_tank gas_meter oil_barrel heat_pump mode_fan air_purifier neurology model_training view_kanban view_timeline waterfall_chart scatter_plot data_thresholding ssid_chart step stairs search_check hardware settings_input_component co2 multiline_chart package_2 deployed_code token grid_view blur_on safety_check grading encrypted shield_person license approval_delegation monitoring query_stats flag_2 lan target trophy policy call_split merge'.split())
cat=None;seen=set();items=[];miss=[]
for line in open(os.path.join(os.path.dirname(__file__),'icon_list.txt'),encoding='utf-8'):
    line=line.rstrip('\n')
    if not line or line.startswith('# '):continue
    if line.startswith('## '):cat=line[3:].split('｜');continue
    n,zh,kw=line.split('|');custom=n.startswith('*');n=n.lstrip('*')
    if n in seen or n in DROP:continue
    if not custom and n not in R:miss.append(n);continue
    seen.add(n);items.append(dict(id=n,zh=zh,kw=kw,cat=cat[0],catEn=cat[1],custom=custom,pop=pop.get(n,0),rank=rank.get(n,99999)))
EXTRA={}
for line in open(os.path.join(os.path.dirname(__file__),'icon_kw_extra.txt'),encoding='utf-8'):
    if line.strip() and not line.startswith('#'):
        n,k=line.rstrip('\n').split('|');EXTRA[n]=k
for i in items:
    if i['id'] in EXTRA:i['kw']=' '.join(dict.fromkeys((i['kw']+' '+EXTRA[i['id']]).split()))
out=[];stat=collections.OrderedDict()
for c in QUOTA:
    L=[i for i in items if i['cat']==c];keep=[i for i in L if i['id'] in KEEP or i['custom']];rest=sorted([i for i in L if i not in keep],key=lambda i:i['rank'])
    sel=set(i['id'] for i in keep+rest[:max(0,QUOTA[c]-len(keep))])
    chosen=[i for i in L if i['id'] in sel]   # 保留人工排列順序（相關的放一起）
    for i in chosen:
        en=[t for t in tags.get(i['id'],[]) if t.isascii()][:6];i['en']=' '.join(dict.fromkeys([i['id'].replace('_',' ')]+en))
    out+=chosen;stat[c]=len(chosen)
json.dump({'source':'Google Fonts icon metadata popularity + manual relevance','count':len(out),'icons':out},open(os.path.join(os.path.dirname(__file__),'icon_selected.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=0)
print(len(out),dict(stat));print('missing',miss)

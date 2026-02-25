# add_theaters.ps1 - 新しい芝居小屋を theaters_registry に追加
# UTF-8 BOM付きで保存して実行すること

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 既存データ読み込み（UTF-16 BOMあり）
$bytes = [System.IO.File]::ReadAllBytes("$PSScriptRoot\..\__tmp_theaters.json")
$raw = [System.Text.Encoding]::Unicode.GetString($bytes).TrimStart([char]0xFEFF).Trim()
$data = $raw | ConvertFrom-Json

Write-Host "現在の芝居小屋数: $($data.theaters.Count)"

# 新しい芝居小屋データ
$kashimo = [PSCustomObject]@{
    id = "kashimo_meijiza"
    name = "かしも明治座"
    name_kana = "かしもめいじざ"
    location = "岐阜県中津川市加子母4793-2"
    description = "明治27年（1894年）建築の木造芝居小屋。岐阜県指定有形民俗文化財。本花道・仮花道・すっぽん・廻り舞台（人力）・二階席（コの字型）を備える本格的な農村芝居小屋。加子母歌舞伎の本拠地として毎年公演が行われ、中村七之助が名誉館主を務める。楽屋の壁には十八代目中村勘三郎らの落し書きが残る。"
    has_hanamichi = $true
    has_mawari_butai = $true
    has_suppon = $true
    capacity = $null
    cultural_property = "岐阜県指定有形民俗文化財"
    visitable = $true
    has_parking = $true
    parking_note = "駐車場あり"
    access_info = "TEL: 0573-79-3611 / 開館時間 10:00〜16:00 / 月曜休館"
    latitude = 35.5196
    longitude = 137.4969
    website = "https://meijiza.jp/"
    registered_by = "admin"
    updated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
}

$aioiza = [PSCustomObject]@{
    id = "aioiza"
    name = "美濃歌舞伎博物館 相生座"
    name_kana = "みのかぶきはくぶつかん あいおいざ"
    location = "岐阜県瑞浪市日吉町8004-25"
    description = "明治27年（1894年）着工・翌年完成の相生座と、明治初期に名古屋・大曽根から移築された常盤座を合体復元し昭和51年（1976年）に誕生した芝居小屋。江戸末期から明治・大正・昭和の農村歌舞伎の衣裳・かつら・小道具約4,000点を収蔵。市川猿之助（現猿翁）・中村勘三郎らも公演を行った。毎年9月に長月公演を開催。入館料300円・要予約。"
    has_hanamichi = $true
    has_mawari_butai = $true
    has_suppon = $true
    capacity = $null
    cultural_property = $null
    visitable = $true
    has_parking = $false
    access_info = "TEL: 0572-68-0205 / 開館 10:00〜16:00 / 月曜休館・要予約 / JR瑞浪駅からタクシー約4,000円"
    latitude = 35.3695
    longitude = 137.4066
    website = "http://nakasendou.jp/aioiza/"
    registered_by = "admin"
    updated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
}

$murakuniza = [PSCustomObject]@{
    id = "murakuniza"
    name = "村国座"
    name_kana = "むらくにざ"
    location = "岐阜県各務原市各務おがせ町3-46-1（村国神社境内）"
    description = "明治初期建設の農村歌舞伎舞台。廻り舞台を備え、130年以上経過した黒光りする木の柱や板張りの客席・大きな梁の小屋組みなど、農村芝居の姿をよく伝える。国の重要有形民俗文化財に指定。子供歌舞伎も盛んに行われている。平成の大修理を経て保存。"
    has_hanamichi = $true
    has_mawari_butai = $true
    has_suppon = $false
    capacity = $null
    cultural_property = "国指定重要有形民俗文化財"
    visitable = $true
    has_parking = $true
    parking_note = "無料駐車場 普通車80台（大型バス可）"
    access_info = "TEL: 058-370-7144 / 名古屋から約1時間30分・岐阜市から約40分"
    latitude = 35.4273
    longitude = 136.8584
    registered_by = "admin"
    updated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
}

# マージ
$toAdd = @($kashimo, $aioiza, $murakuniza)
$theatersList = [System.Collections.Generic.List[object]]($data.theaters)

foreach ($t in $toAdd) {
    $existing = $theatersList | Where-Object { $_.id -eq $t.id }
    if ($existing) {
        $idx = $theatersList.IndexOf($existing)
        $theatersList[$idx] = $t
        Write-Host "更新: $($t.name)"
    } else {
        $theatersList.Add($t)
        Write-Host "追加: $($t.name)"
    }
}

$data.theaters = $theatersList.ToArray()

# UTF-8 (BOMなし) で保存
$json = $data | ConvertTo-Json -Depth 10 -Compress
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("$PSScriptRoot\..\__tmp_theaters_new.json", $json, $utf8NoBom)
Write-Host "保存完了: $($data.theaters.Count)件"

# KVに書き込み
Write-Host "KVに書き込み中..."
Set-Location "$PSScriptRoot\.."
npx wrangler kv key put --binding CHAT_HISTORY "theaters_registry" --path "__tmp_theaters_new.json"
Write-Host "完了！"

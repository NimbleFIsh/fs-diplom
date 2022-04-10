<?php
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) die();

    function filerw($file, $write = false, $data = false) {
        return $write ? file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT)) : (file_get_contents($file) ? json_decode(file_get_contents($file), JSON_PRETTY_PRINT) : []);
    }

    switch ($data['command'])
    {
        case 'getFilms':
            echo json_encode(filerw('films.json'));
            break;

        case 'getHolls':
            echo json_encode(filerw('holls.json'));
            break;

        case 'getCurrentHoll':
            $tmp = filerw('holls.json');
            $out = null;
            foreach ($tmp[$data['holl']]['seasons'] as $key => $season)
                if ($season['film'] == urldecode($data['film']) && $season['time'] == $data['time']) $out = $season['place'];
            echo json_encode([ 'place' => $out, 'price' => $tmp[$data['holl']]['price'], 'size' => $tmp[$data['holl']]['size'] ]);
            break;

        case 'placeIsMine':
            $tmp = filerw('holls.json');
            // $tmp[$data['holl']]['seasons'][array_search([ 'film' => $data['film'], 'time' => $data['time'] ], $tmp[$data['holl']]['seasons'])]['place'][$data['r']][$data['c']] = 0;
            foreach ($tmp[$data['holl']]['seasons'] as $key => $season)
                if ($season['film'] == urldecode($data['film']) && $season['time'] == $data['time']) {
                    foreach ($data['package'] as $value)
                        $tmp[$data['holl']]['seasons'][$key]['place'][$value['r']][$value['c']] = 0;
                    filerw('holls.json', true, $tmp);
                }
            break;

        case 'getQR':
            include('./phpqrcode/qrlib.php');
            // $qr = "Электронный билет\n";
            // $qr .= "На фильм: ".$data['film']."\n";
            // $qr .= "Места: ";
            // foreach ($data['place'] as $value) $qr .= $value.", ";
            // $qr .= "\n";
            // $qr .= "В зале: ".$data['holl']."\n";
            // $qr .= "Начало сеанса: ".$data['time']."\n";
            QRcode::svg("Электронный билет\n".$data['data']);
            
            // .innerHTML = `<img src="data:image/svg+xml;base64,${btoa(xhr.response)}" />`;
            break;
    }

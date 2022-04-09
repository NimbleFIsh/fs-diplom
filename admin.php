<?php
    $H = json_decode(file_get_contents('./authorization.json'), true);
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) die();

    function filerw($file, $write = false, $data = false) {
        return $write ? file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT)) : (file_get_contents($file) ? json_decode(file_get_contents($file), JSON_PRETTY_PRINT) : []);
    }

    function read() {
        return filerw('holls.json');
    }

    if (hash('sha256', $data['auth']['mail']) === $H['mail'] && hash('sha256', $data['auth']['pwd']) === $H['pwd'])
    {
        switch ($data['command'])
        {
            case 'addHoll':
                $tmp = read();
                if (!array_key_exists($data['holl'], $tmp))
                {
                    $tmp[$data['holl']] = [ 'isActive' => false, 'place' => [], 'price' => [ 'standart' => 0, 'vip' => 0 ], 'size' => [0, 0], 'seasons' => [] ];
                    filerw('holls.json', true, $tmp);
                    echo 'holl success added!';
                }
                else echo 'holl already exist!';
                break;
    
            case 'removeHoll':
                $tmp = read();
                if (array_key_exists($data['holl'], $tmp))
                {
                    unset($tmp[$data['holl']]);
                    filerw('holls.json', true, $tmp);
                    echo 'holl success removed!';
                }
                else echo 'hall not exist!';
                break;
            
            case 'getHolls':
                echo json_encode(read());
                break;
                
            case 'getHoll':
                echo json_encode(read()[$data['holl']]);
                break;
    
            case 'changeHoll':
                $tmp = read();
                if (array_key_exists($data['holl'], $tmp))
                {
                    if ($data['place'])
                    {
                        $tmp[$data['holl']]['place'] = $data['place'];
                        if ($data['size']) $tmp[$data['holl']]['size'] = $data['size'];
                    }
                    if ($data['price'])
                    {
                        $tmp[$data['holl']]['price']['standart'] = $data['price']['standart'];
                        $tmp[$data['holl']]['price']['vip'] = $data['price']['vip'];
                    }
                    if ($data['movies']) $tmp[$data['holl']]['movies'] = $data['movies'];
                    filerw('holls.json', true, $tmp);
                }
                else echo 'hall not exist!';
                break;
            
            case 'film':
                $film = filerw('films.json');
                if ($data['mode'])
                {
                    if ($data['mode'] == 'r') unset($film[$data['name']]);
                    else if ($data['mode'] == 'a') $film[$data['name']] = $data['time'];
                    filerw('films.json', true, $film);
                } else echo json_encode($film);
                break;
            
            case 'season':
                $tmp = read();
                if (array_key_exists($data['holl'], $tmp))
                {
                    if ($data['mode'] === 'a')
                        array_push($tmp[$data['holl']]['seasons'], ['film' => $data['film'], 'time' => $data['time'], 'place' => $tmp[$data['holl']]['place']]);
                    else if ($data['mode'] === 'r')
                    {
                        foreach ($tmp[$data['holl']]['seasons'] as $key => $value)
                            if ($value['film'] == $data['film'] && $value['time'] == $data['time'])
                                unset($tmp[$data['holl']]['seasons'][$key]);
                    }
                    filerw('holls.json', true, $tmp);
                }
                else echo 'hall not exist!';
                break;
            
            case 'changeActive':
                $tmp = read();
                if (array_key_exists($data['holl'], $tmp))
                {
                    $tmp[$data['holl']]['isActive'] = $data['status'];
                    filerw('holls.json', true, $tmp);
                }
                else echo 'hall not exist!';
                break;
        }

    } else echo "ACCESS DENIED! YOU A NOT ADMIN!";
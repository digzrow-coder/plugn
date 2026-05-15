<?php
use yii\helpers\Html;

/* @var $this yii\web\View */
/* @var $model common\models\TicketComment */

?>
<div class="ticket-commented">

    <?php if($model->agent) { ?>
        <p>New comment from <?= Html::encode($model->agent->agent_name) ?>,</p>
    <?php } else if($model->staff) { ?>
        <p>New comment from <?= Html::encode($model->staff->staff_name) ?>,</p>
    <?php } ?>

    <p><?= nl2br(Html::encode($model->ticket_comment_detail)) ?></p>
</div>

